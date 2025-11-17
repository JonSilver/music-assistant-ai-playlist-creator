import type { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { attemptPromise } from "@jfdi/attempt";
import type { PlaylistDatabase } from "../db/schema.js";
import { jobStore } from "../services/jobStore.js";
import { generatePlaylistJob } from "../services/playlistGenerator.js";
import { createPlaylist } from "../services/playlistCreator.js";
import { refinePlaylist, replaceTrack } from "../services/playlistRefine.js";
import { matchTrack } from "../services/trackMatching.js";
import { MusicAssistantClient } from "../services/musicAssistant.js";
import { settingsUtils } from "../../../shared/settings-schema.js";
import {
    BackendGeneratePlaylistRequestSchema,
    BackendCreatePlaylistRequestSchema,
    BackendRefinePlaylistRequestSchema,
    BackendRetryTrackRequestSchema,
    BackendReplaceTrackRequestSchema
} from "../../../shared/types.js";
import type {
    BackendGeneratePlaylistResponse,
    BackendCreatePlaylistResponse,
    BackendRefinePlaylistResponse,
    BackendRetryTrackResponse,
    BackendReplaceTrackResponse,
    BackendTestMAResponse
} from "../../../shared/types.js";

export const setupPlaylistsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // POST /api/playlists/generate - Start playlist generation
    router.post("/playlists/generate", (req: Request, res: Response) => {
        const parseResult = BackendGeneratePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const { prompt, providerPreference, webhookUrl, trackCount } = parseResult.data;

        // Get settings from database
        const settings = settingsUtils.getSettings(db);

        // Determine which provider to use
        let providerConfig = settings.defaultProvider;
        if (providerPreference !== undefined) {
            const preferredProvider = settings.providers.find(p => p.id === providerPreference);
            if (preferredProvider !== undefined) {
                providerConfig = preferredProvider;
            }
        }

        // Create job
        const jobId = randomUUID();
        jobStore.createJob(jobId, prompt, providerPreference, webhookUrl);

        // Start generation in background
        generatePlaylistJob(
            {
                jobId,
                prompt,
                musicAssistantUrl: settings.musicAssistantUrl,
                providerConfig,
                customSystemPrompt: settings.customSystemPrompt,
                providerKeywords: settings.providerPreference,
                webhookUrl,
                trackCount
            },
            db
        ).catch((err: unknown) => {
            console.error(`[Job ${jobId}] Unhandled error:`, err);
        });

        const response: BackendGeneratePlaylistResponse = { jobId };
        res.json(response);
    });

    // GET /api/playlists/jobs/:jobId - Get job status (for polling)
    router.get("/playlists/jobs/:jobId", (req: Request, res: Response) => {
        const { jobId } = req.params;
        const job = jobStore.getJob(jobId);

        if (job === undefined) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        res.json({
            jobId: job.jobId,
            status: job.status,
            playlistUrl: job.playlistUrl,
            error: job.error
        });
    });

    // GET /api/playlists/jobs/:jobId/stream - SSE endpoint for progress updates
    router.get("/playlists/jobs/:jobId/stream", (req: Request, res: Response) => {
        const { jobId } = req.params;
        const job = jobStore.getJob(jobId);

        if (job === undefined) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        // Set up SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Send initial state
        res.write(
            `data: ${JSON.stringify({
                jobId: job.jobId,
                status: job.status,
                tracks: job.tracks,
                totalTracks: job.totalTracks,
                matchedTracks: job.matchedTracks,
                playlistUrl: job.playlistUrl,
                error: job.error
            })}\n\n`
        );

        // Set up listener for updates
        const listener = (update: {
            jobId: string;
            status: string;
            tracks?: unknown[];
            totalTracks?: number;
            matchedTracks?: number;
            playlistUrl?: string;
            error?: string;
        }): void => {
            res.write(`data: ${JSON.stringify(update)}\n\n`);

            // Close connection when job is completed or failed
            if (update.status === "completed" || update.status === "failed") {
                res.end();
            }
        };

        jobStore.addListener(jobId, listener);

        // Clean up on client disconnect
        req.on("close", () => {
            jobStore.removeListener(jobId, listener);
        });
    });

    // POST /api/playlists/create - Create playlist in Music Assistant
    router.post("/playlists/create", async (req: Request, res: Response) => {
        const parseResult = BackendCreatePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const requestBody = req.body as { tracks?: unknown[] };
            console.error(
                "[Create Playlist] Validation error:",
                JSON.stringify(parseResult.error.issues, null, 2)
            );
            console.error(
                "[Create Playlist] Sample track data:",
                JSON.stringify(requestBody.tracks?.[0], null, 2)
            );
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.issues
            });
            return;
        }

        const { playlistName, prompt, tracks } = parseResult.data;

        // Get settings from database
        const settings = settingsUtils.getSettings(db);

        const [err, result] = await attemptPromise(async () =>
            createPlaylist(playlistName, tracks, settings.musicAssistantUrl)
        );

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to create playlist",
                details: err.message
            });
            return;
        }

        // Save to history
        db.addPromptHistory(prompt, playlistName, result.tracksAdded);

        const response: BackendCreatePlaylistResponse = {
            success: true,
            playlistId: result.playlistId,
            playlistUrl: result.playlistUrl,
            tracksAdded: result.tracksAdded
        };
        res.json(response);
    });

    // POST /api/playlists/refine - Refine existing playlist with AI
    router.post("/playlists/refine", async (req: Request, res: Response) => {
        const parseResult = BackendRefinePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const { refinementPrompt, currentTracks, providerPreference } = parseResult.data;

        // Get settings from database
        const settings = settingsUtils.getSettings(db);

        // Determine which provider to use
        let providerConfig = settings.defaultProvider;
        if (providerPreference !== undefined) {
            const preferredProvider = settings.providers.find(p => p.id === providerPreference);
            if (preferredProvider !== undefined) {
                providerConfig = preferredProvider;
            }
        }

        const [err, refinedTracks] = await attemptPromise(async () =>
            refinePlaylist(
                refinementPrompt,
                currentTracks,
                settings.musicAssistantUrl,
                providerConfig,
                settings.customSystemPrompt
            )
        );

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to refine playlist",
                details: err.message
            });
            return;
        }

        const response: BackendRefinePlaylistResponse = { tracks: refinedTracks };
        res.json(response);
    });

    // POST /api/playlists/tracks/retry - Retry matching a single track
    router.post("/playlists/tracks/retry", async (req: Request, res: Response) => {
        const parseResult = BackendRetryTrackRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const { track, providerKeywords = [] } = parseResult.data;

        // Get settings from database
        const settings = settingsUtils.getSettings(db);

        const maClient = new MusicAssistantClient(settings.musicAssistantUrl);
        await maClient.connect();

        const [err, matchedTrack] = await attemptPromise(async () =>
            matchTrack(track.suggestion, maClient, providerKeywords)
        );

        maClient.disconnect();

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to retry track matching",
                details: err.message
            });
            return;
        }

        const response: BackendRetryTrackResponse = { track: matchedTrack };
        res.json(response);
    });

    // POST /api/playlists/tracks/replace - Replace a track with AI suggestion
    router.post("/playlists/tracks/replace", async (req: Request, res: Response) => {
        const parseResult = BackendReplaceTrackRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const { trackToReplace, currentTracks, originalPrompt, playlistName, providerPreference } =
            parseResult.data;

        // Get settings from database
        const settings = settingsUtils.getSettings(db);

        // Determine which provider to use
        let providerConfig = settings.defaultProvider;
        if (providerPreference !== undefined) {
            const preferredProvider = settings.providers.find(p => p.id === providerPreference);
            if (preferredProvider !== undefined) {
                providerConfig = preferredProvider;
            }
        }

        const [err, replacementTrack] = await attemptPromise(async () =>
            replaceTrack(
                trackToReplace,
                currentTracks,
                originalPrompt,
                playlistName,
                settings.musicAssistantUrl,
                providerConfig,
                settings.customSystemPrompt
            )
        );

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to replace track",
                details: err.message
            });
            return;
        }

        const response: BackendReplaceTrackResponse = { track: replacementTrack };
        res.json(response);
    });

    // POST /api/playlists/test-ma - Test Music Assistant connection
    router.post("/playlists/test-ma", async (req: Request, res: Response) => {
        const { musicAssistantUrl } = req.body as { musicAssistantUrl?: string };

        if (musicAssistantUrl === undefined || musicAssistantUrl === "") {
            res.status(400).json({ error: "musicAssistantUrl is required" });
            return;
        }

        const [err] = await attemptPromise(async () => {
            const maClient = new MusicAssistantClient(musicAssistantUrl);
            await maClient.connect();
            maClient.disconnect();
        });

        if (err !== undefined) {
            const response: BackendTestMAResponse = { success: false, error: err.message };
            res.json(response);
            return;
        }

        const response: BackendTestMAResponse = { success: true };
        res.json(response);
    });
};
