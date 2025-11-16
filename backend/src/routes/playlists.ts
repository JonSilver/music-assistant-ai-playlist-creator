import type { Router, Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { attemptPromise } from "@jfdi/attempt";
import type { PlaylistDatabase } from "../db/schema.js";
import { jobStore } from "../services/jobStore.js";
import { generatePlaylistJob } from "../services/playlistGenerator.js";
import { createPlaylist } from "../services/playlistCreator.js";
import { settingsUtils } from "../../../shared/settings-schema.js";
import { TrackMatchSchema } from "../../../shared/types.js";

const GeneratePlaylistRequestSchema = z.object({
    prompt: z.string().min(1),
    providerPreference: z.string().optional(),
    webhookUrl: z.string().url().optional()
});

const CreatePlaylistRequestSchema = z.object({
    playlistName: z.string().min(1),
    prompt: z.string(),
    tracks: z.array(TrackMatchSchema)
});

export const setupPlaylistsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // POST /api/playlists/generate - Start playlist generation
    router.post("/playlists/generate", (req: Request, res: Response) => {
        const parseResult = GeneratePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const { prompt, providerPreference, webhookUrl } = parseResult.data;

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
                webhookUrl
            },
            db
        ).catch(err => {
            console.error(`[Job ${jobId}] Unhandled error:`, err);
        });

        res.json({ jobId });
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
        const parseResult = CreatePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
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

        res.json({
            success: true,
            playlistId: result.playlistId,
            playlistUrl: result.playlistUrl,
            tracksAdded: result.tracksAdded
        });
    });
};
