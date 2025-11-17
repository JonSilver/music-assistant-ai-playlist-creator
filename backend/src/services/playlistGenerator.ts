import { attemptPromise } from "@jfdi/attempt";
import type { AIProviderConfig, TrackMatch } from "../../../shared/types.js";
import { generatePlaylist as generatePlaylistAI } from "./ai.js";
import { MusicAssistantClient } from "./musicAssistant.js";
import { matchTracksProgressively } from "./trackMatching.js";
import { createPlaylist } from "./playlistCreator.js";
import { jobStore } from "./jobStore.js";
import { callWebhook } from "./webhook.js";
import type { PlaylistDatabase } from "../db/schema.js";

interface GeneratePlaylistParams {
    jobId: string;
    prompt: string;
    musicAssistantUrl: string;
    providerConfig: AIProviderConfig;
    customSystemPrompt?: string;
    providerKeywords?: string[];
    webhookUrl?: string;
    trackCount?: number;
}

export const generatePlaylistJob = async (
    params: GeneratePlaylistParams,
    db: PlaylistDatabase
): Promise<void> => {
    const {
        jobId,
        prompt,
        musicAssistantUrl,
        providerConfig,
        customSystemPrompt,
        providerKeywords = [],
        webhookUrl,
        trackCount
    } = params;

    // eslint-disable-next-line no-restricted-syntax
    try {
        // Step 1: Generate tracks with AI
        jobStore.updateJob(jobId, { status: "generating_ai" });

        // Get favorite artists
        const maClient = new MusicAssistantClient(musicAssistantUrl);
        await maClient.connect();
        const favoriteArtists = await maClient.getFavoriteArtists();
        maClient.disconnect();

        const [aiErr, aiResult] = await attemptPromise(async () =>
            generatePlaylistAI({
                prompt,
                favoriteArtists,
                providerConfig,
                customSystemPrompt,
                trackCount
            })
        );

        if (aiErr !== undefined) {
            throw new Error(`AI generation failed: ${aiErr.message}`);
        }

        // Initialize tracks - all marked as matching since we'll process them all
        const initialTracks: TrackMatch[] = aiResult.tracks.map(suggestion => ({
            suggestion,
            matched: false,
            matching: true
        }));

        jobStore.updateJob(jobId, {
            status: "matching_tracks",
            tracks: initialTracks,
            totalTracks: initialTracks.length,
            matchedTracks: 0
        });

        // Step 2: Match tracks progressively
        const maClientForMatching = new MusicAssistantClient(musicAssistantUrl);
        await maClientForMatching.connect();

        const tracks = [...initialTracks];

        await matchTracksProgressively(
            tracks,
            maClientForMatching,
            (index, updatedTrack) => {
                tracks[index] = updatedTrack;
                const matchedCount = tracks.filter(t => t.matched).length;
                jobStore.updateJob(jobId, {
                    tracks: [...tracks],
                    matchedTracks: matchedCount
                });
            },
            providerKeywords
        );

        maClientForMatching.disconnect();

        // For webhook requests, auto-create the playlist
        if (webhookUrl !== undefined && webhookUrl !== "") {
            // Step 3: Create playlist
            jobStore.updateJob(jobId, { status: "creating_playlist" });

            // Generate playlist name from prompt
            const playlistName = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;

            const [createErr, result] = await attemptPromise(async () =>
                createPlaylist(playlistName, tracks, musicAssistantUrl)
            );

            if (createErr !== undefined) {
                throw new Error(`Playlist creation failed: ${createErr.message}`);
            }

            // Save to history
            db.addPromptHistory(prompt, playlistName, result.tracksAdded);

            // Mark as completed with playlist URL
            jobStore.updateJob(jobId, {
                status: "completed",
                playlistUrl: result.playlistUrl,
                playlistId: result.playlistId,
                tracksAdded: result.tracksAdded
            });

            // Call webhook
            await callWebhook(webhookUrl, {
                jobId,
                success: true,
                playlistUrl: result.playlistUrl
            });
        } else {
            // For UI requests, just mark as completed with matched tracks
            // The UI will call a separate endpoint to create the playlist
            jobStore.updateJob(jobId, {
                status: "completed"
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Job ${jobId}] Failed:`, errorMessage);

        jobStore.updateJob(jobId, {
            status: "failed",
            error: errorMessage
        });

        // Call webhook with error if provided
        if (webhookUrl !== undefined && webhookUrl !== "") {
            await callWebhook(webhookUrl, {
                jobId,
                success: false,
                error: errorMessage
            });
        }
    }
};
