import type { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { attemptPromise } from "@jfdi/attempt";
import type { PlaylistDatabase } from "../db/schema.js";
import { jobStore } from "../services/jobStore.js";
import { generatePlaylistJob } from "../services/playlistGenerator.js";
import { createPlaylist } from "../services/playlistCreator.js";
import { refinePlaylist, replaceTrack } from "../services/playlistRefine.js";
import { matchTrack } from "../services/trackMatching.js";
import { settingsUtils } from "../../../shared/settings-schema.js";
import { withMusicAssistant } from "../utils/maClientUtils.js";
import { validateRequest } from "../middleware/validation.js";
import { selectProvider } from "../utils/providerUtils.js";
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
    BackendTestMAResponse,
    BackendGeneratePlaylistRequest,
    BackendCreatePlaylistRequest,
    BackendRefinePlaylistRequest,
    BackendRetryTrackRequest,
    BackendReplaceTrackRequest
} from "../../../shared/types.js";

export const setupPlaylistsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // POST /api/playlists/generate - Start playlist generation
    router.post(
        "/playlists/generate",
        validateRequest(BackendGeneratePlaylistRequestSchema),
        (req: Request, res: Response) => {
            const { prompt, providerPreference, webhookUrl, trackCount } =
                req.body as BackendGeneratePlaylistRequest;

            // Get settings from database
            const settings = settingsUtils.getSettings(db);
            const providerConfig = selectProvider(settings, providerPreference);

            // Create job
            const jobId = randomUUID();
            jobStore.createJob(jobId, prompt, providerPreference, webhookUrl);

            // Start generation in background
            generatePlaylistJob(
                {
                    jobId,
                    prompt,
                    musicAssistantUrl: settings.musicAssistantUrl,
                    musicAssistantToken: settings.musicAssistantToken,
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
        }
    );

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
            tracks: job.tracks,
            totalTracks: job.totalTracks,
            matchedTracks: job.matchedTracks,
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
            if (update.status === "completed" || update.status === "failed") 
                res.end();
            
        };

        jobStore.addListener(jobId, listener);

        // Clean up on client disconnect
        req.on("close", () => {
            jobStore.removeListener(jobId, listener);
        });
    });

    // POST /api/playlists/create - Create playlist in Music Assistant
    router.post(
        "/playlists/create",
        validateRequest(BackendCreatePlaylistRequestSchema),
        async (req: Request, res: Response) => {
            const { playlistName, prompt, tracks } = req.body as BackendCreatePlaylistRequest;

            // Get settings from database
            const settings = settingsUtils.getSettings(db);

            const [err, result] = await attemptPromise(async () =>
                createPlaylist(playlistName, tracks, settings.musicAssistantUrl, settings.musicAssistantToken)
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
        }
    );

    // POST /api/playlists/refine - Refine existing playlist with AI
    router.post(
        "/playlists/refine",
        validateRequest(BackendRefinePlaylistRequestSchema),
        async (req: Request, res: Response) => {
            const { refinementPrompt, currentTracks, providerPreference } =
                req.body as BackendRefinePlaylistRequest;

            // Get settings from database
            const settings = settingsUtils.getSettings(db);
            const providerConfig = selectProvider(settings, providerPreference);

            const [err, refinedTracks] = await attemptPromise(async () =>
                refinePlaylist(
                    refinementPrompt,
                    currentTracks,
                    settings.musicAssistantUrl,
                    settings.musicAssistantToken,
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
        }
    );

    // POST /api/playlists/tracks/retry - Retry matching a single track
    router.post(
        "/playlists/tracks/retry",
        validateRequest(BackendRetryTrackRequestSchema),
        async (req: Request, res: Response) => {
            const { track, providerKeywords = [] } = req.body as BackendRetryTrackRequest;

            // Get settings from database
            const settings = settingsUtils.getSettings(db);

            const [err, matchedTrack] = await attemptPromise(async () =>
                withMusicAssistant(settings.musicAssistantUrl, settings.musicAssistantToken, async maClient =>
                    matchTrack(track.suggestion, maClient, providerKeywords)
                )
            );

            if (err !== undefined) {
                res.status(500).json({
                    error: "Failed to retry track matching",
                    details: err.message
                });
                return;
            }

            const response: BackendRetryTrackResponse = { track: matchedTrack };
            res.json(response);
        }
    );

    // POST /api/playlists/tracks/replace - Replace a track with AI suggestion
    router.post(
        "/playlists/tracks/replace",
        validateRequest(BackendReplaceTrackRequestSchema),
        async (req: Request, res: Response) => {
            const {
                trackToReplace,
                currentTracks,
                originalPrompt,
                playlistName,
                providerPreference
            } = req.body as BackendReplaceTrackRequest;

            // Get settings from database
            const settings = settingsUtils.getSettings(db);
            const providerConfig = selectProvider(settings, providerPreference);

            const [err, replacementTrack] = await attemptPromise(async () =>
                replaceTrack(
                    trackToReplace,
                    currentTracks,
                    originalPrompt,
                    playlistName,
                    settings.musicAssistantUrl,
                    settings.musicAssistantToken,
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
        }
    );

    // POST /api/playlists/test-ma - Test Music Assistant connection and auth
    router.post("/playlists/test-ma", async (req: Request, res: Response) => {
        const { musicAssistantUrl, musicAssistantToken } = req.body as {
            musicAssistantUrl?: string;
            musicAssistantToken?: string;
        };

        if (musicAssistantUrl === undefined || musicAssistantUrl === "") {
            res.status(400).json({ error: "musicAssistantUrl is required" });
            return;
        }

        // Actually test auth by calling getFavoriteArtists (requires auth)
        const [err] = await attemptPromise(async () =>
            withMusicAssistant(musicAssistantUrl, musicAssistantToken, async maClient =>
                maClient.getFavoriteArtists()
            )
        );

        if (err !== undefined) {
            const response: BackendTestMAResponse = { success: false, error: err.message };
            res.json(response);
            return;
        }

        const response: BackendTestMAResponse = { success: true };
        res.json(response);
    });
};
