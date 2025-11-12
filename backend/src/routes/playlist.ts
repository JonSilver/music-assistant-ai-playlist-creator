import type { Router, Request, Response } from "express";
import { attemptPromise } from "@jfdi/attempt";
import { MusicAssistantClient } from "../services/musicAssistant.js";
import { AIService } from "../services/ai.js";
import type { PlaylistDatabase } from "../db/schema.js";
import {
    type CreatePlaylistResponse,
    type CreatePlaylistInMAResponse,
    type RefinePlaylistResponse,
    type TrackMatch,
    type TrackSuggestion,
    CreatePlaylistRequestSchema,
    RefinePlaylistRequestSchema,
    TrackSuggestionSchema
} from "../../../shared/types.js";

const matchTrack = async (
    suggestion: TrackSuggestion,
    maClient: MusicAssistantClient
): Promise<TrackMatch> => {
    // Use Music Assistant's search - it's excellent, trust it
    const searchQuery = `${suggestion.title} ${suggestion.artist}`;
    console.log(`Searching for: "${searchQuery}"`);
    const searchResults = await maClient.searchTracks(searchQuery, 5);

    console.log(`Search returned ${searchResults.length} results`);
    if (searchResults.length > 0) {
        const firstTrack = searchResults[0];
        console.log(
            `Matched: "${suggestion.title}" by "${suggestion.artist}" -> "${firstTrack.name}" by "${firstTrack.artists?.[0]?.name || "unknown"}"`
        );
        return {
            suggestion,
            matched: true,
            maTrack: firstTrack
        };
    }

    console.log(`No match found for: "${suggestion.title}" by "${suggestion.artist}"`);
    return {
        suggestion,
        matched: false
    };
};

export const setupPlaylistRoutes = (router: Router, db: PlaylistDatabase): void => {
    // Generate playlist suggestions (AI only, no matching yet)
    router.post("/playlist/generate", async (req: Request, res: Response) => {
        // Validate request body
        const parseResult = CreatePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const request = parseResult.data;

        const [err, result] = await attemptPromise(async () => {
            // Get settings
            const maUrl = db.getSetting("musicAssistantUrl");
            const aiProvidersJson = db.getSetting("aiProviders");
            const customSystemPrompt = db.getSetting("customSystemPrompt");

            if (maUrl === null || maUrl.length === 0) {
                throw new Error("Music Assistant URL not configured");
            }

            // Parse providers
            const aiProviders = aiProvidersJson !== null ? JSON.parse(aiProvidersJson) : [];
            if (aiProviders.length === 0) {
                throw new Error("No AI providers configured");
            }

            // Find the requested provider or use the first one
            const providerId = request.providerId ?? aiProviders[0].id;
            const providerConfig = aiProviders.find((p: { id: string }) => p.id === providerId);
            if (providerConfig === undefined) {
                throw new Error(`Provider not found: ${providerId}`);
            }

            // Connect to Music Assistant briefly to get favorite artists
            const maClient = new MusicAssistantClient(maUrl);
            await maClient.connect();
            const favoriteArtists = await maClient.getFavoriteArtists();
            maClient.disconnect();

            // Get AI suggestions
            const aiService = new AIService();

            const aiResponse = await aiService.generatePlaylist({
                prompt: request.prompt,
                favoriteArtists,
                providerConfig,
                customSystemPrompt: customSystemPrompt ?? undefined,
                trackCount: request.trackCount
            });

            // Return unmatched tracks immediately with matching state
            const matches: TrackMatch[] = aiResponse.tracks.map(suggestion => ({
                suggestion,
                matched: false,
                matching: true
            }));

            // Save to history
            db.addPromptHistory(request.prompt, request.playlistName ?? null, matches.length);

            const response: CreatePlaylistResponse = {
                success: true,
                playlistName: request.playlistName ?? "AI Generated Playlist",
                matches,
                totalSuggested: matches.length,
                totalMatched: 0
            };

            return response;
        });

        if (err !== undefined) {
            console.error("Playlist generation error:", err);
            res.status(500).json({
                error: "Failed to generate playlist",
                details: err.message
            });
            return;
        }

        res.json(result);
    });

    // Match a single track
    router.post("/playlist/match-track", async (req: Request, res: Response) => {
        // Validate request body
        const parseResult = TrackSuggestionSchema.safeParse(req.body.suggestion);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const suggestion = parseResult.data;

        const [err, result] = await attemptPromise(async () => {
            const maUrl = db.getSetting("musicAssistantUrl");
            if (maUrl === null || maUrl.length === 0) {
                throw new Error("Music Assistant URL not configured");
            }

            const maClient = new MusicAssistantClient(maUrl);
            await maClient.connect();

            const match = await matchTrack(suggestion, maClient);

            maClient.disconnect();

            return match;
        });

        if (err !== undefined) {
            console.error("Track matching error:", err);
            res.status(500).json({
                error: "Failed to match track",
                details: err.message
            });
            return;
        }

        res.json(result);
    });

    // Create playlist in Music Assistant
    router.post("/playlist/create", async (req: Request, res: Response) => {
        const { playlistName, tracks } = req.body as { playlistName: string; tracks: TrackMatch[] };

        const [err, result] = await attemptPromise(async () => {
            const maUrl = db.getSetting("musicAssistantUrl");
            if (maUrl === null || maUrl.length === 0) {
                throw new Error("Music Assistant URL not configured");
            }

            const maClient = new MusicAssistantClient(maUrl);
            await maClient.connect();

            // Create playlist
            const playlistId = await maClient.createPlaylist(playlistName);

            // Add matched tracks
            const trackUris = tracks
                .filter(m => m.matched && m.maTrack !== undefined)
                .map(m => m.maTrack!.uri);

            if (trackUris.length > 0) {
                await maClient.addTracksToPlaylist(playlistId, trackUris);
            }

            maClient.disconnect();

            // Save to history
            const promptFromBody = req.body.prompt as string | undefined;
            db.addPromptHistory(promptFromBody ?? "Unknown", playlistName, trackUris.length);

            const response: CreatePlaylistInMAResponse = {
                success: true,
                playlistId,
                tracksAdded: trackUris.length
            };
            return response;
        });

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to create playlist",
                details: err.message
            });
            return;
        }

        res.json(result);
    });

    // Refine playlist
    router.post("/playlist/refine", async (req: Request, res: Response) => {
        // Validate request body
        const parseResult = RefinePlaylistRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        const request = parseResult.data;

        const [err, result] = await attemptPromise(async () => {
            const maUrl = db.getSetting("musicAssistantUrl");
            const aiProvidersJson = db.getSetting("aiProviders");
            const customSystemPrompt = db.getSetting("customSystemPrompt");

            if (maUrl === null || maUrl.length === 0) {
                throw new Error("Music Assistant URL not configured");
            }

            // Parse providers
            const aiProviders = aiProvidersJson !== null ? JSON.parse(aiProvidersJson) : [];
            if (aiProviders.length === 0) {
                throw new Error("No AI providers configured");
            }

            // Find the requested provider or use the first one
            const providerId = request.providerId ?? aiProviders[0].id;
            const providerConfig = aiProviders.find((p: { id: string }) => p.id === providerId);
            if (providerConfig === undefined) {
                throw new Error(`Provider not found: ${providerId}`);
            }

            const maClient = new MusicAssistantClient(maUrl);
            await maClient.connect();

            const favoriteArtists = await maClient.getFavoriteArtists();

            // Build refinement prompt
            const currentTracks = request.currentTracks.map(
                (m: TrackMatch) => `${m.suggestion.title} by ${m.suggestion.artist}`
            );
            const refinementContext = `Current playlist:\n${currentTracks.join("\n")}\n\nRefinement request: ${request.refinementPrompt}`;

            const aiService = new AIService();
            const aiResponse = await aiService.generatePlaylist({
                prompt: refinementContext,
                favoriteArtists,
                providerConfig,
                customSystemPrompt: customSystemPrompt ?? undefined
            });

            maClient.disconnect();

            // Return unmatched tracks immediately - let frontend handle progressive matching
            const matches: TrackMatch[] = aiResponse.tracks.map(suggestion => ({
                suggestion,
                matched: false,
                maTrack: undefined
            }));

            const response: RefinePlaylistResponse = {
                success: true,
                matches,
                totalSuggested: matches.length,
                totalMatched: 0
            };
            return response;
        });

        if (err !== undefined) {
            res.status(500).json({
                error: "Failed to refine playlist",
                details: err.message
            });
            return;
        }

        res.json(result);
    });
};
