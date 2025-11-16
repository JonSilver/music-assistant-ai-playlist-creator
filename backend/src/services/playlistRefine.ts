import { attemptPromise } from "@jfdi/attempt";
import type { AIProviderConfig, TrackMatch } from "../../../shared/types.js";
import { generatePlaylist as generatePlaylistAI } from "./ai.js";
import { MusicAssistantClient } from "./musicAssistant.js";

export const refinePlaylist = async (
    refinementPrompt: string,
    currentTracks: TrackMatch[],
    musicAssistantUrl: string,
    providerConfig: AIProviderConfig,
    customSystemPrompt?: string
): Promise<TrackMatch[]> => {
    const [maConnectErr, maClient] = await attemptPromise(async () => {
        const client = new MusicAssistantClient(musicAssistantUrl);
        await client.connect();
        return client;
    });

    if (maConnectErr !== undefined) {
        throw new Error(`Failed to connect to Music Assistant: ${maConnectErr.message}`);
    }

    const [favoriteErr, favoriteArtists] = await attemptPromise(async () =>
        maClient.getFavoriteArtists()
    );
    maClient.disconnect();

    if (favoriteErr !== undefined) {
        throw new Error(`Failed to get favorite artists: ${favoriteErr.message}`);
    }

    const trackList = currentTracks.map(
        (m: TrackMatch) => `${m.suggestion.title} by ${m.suggestion.artist}`
    );
    const refinementContext = `Current playlist:\n${trackList.join("\n")}\n\nRefinement request: ${refinementPrompt.trim()}`;

    const [aiErr, aiResult] = await attemptPromise(async () =>
        generatePlaylistAI({
            prompt: refinementContext,
            favoriteArtists,
            providerConfig,
            customSystemPrompt
        })
    );

    if (aiErr !== undefined) {
        throw new Error(`Failed to refine playlist: ${aiErr.message}`);
    }

    return aiResult.tracks.map(suggestion => ({
        suggestion,
        matched: false,
        matching: false
    }));
};

export const replaceTrack = async (
    trackToReplace: TrackMatch,
    currentTracks: TrackMatch[],
    originalPrompt: string,
    playlistName: string,
    musicAssistantUrl: string,
    providerConfig: AIProviderConfig,
    customSystemPrompt?: string
): Promise<TrackMatch> => {
    const [maConnectErr, maClient] = await attemptPromise(async () => {
        const client = new MusicAssistantClient(musicAssistantUrl);
        await client.connect();
        return client;
    });

    if (maConnectErr !== undefined) {
        throw new Error(`Failed to connect to Music Assistant: ${maConnectErr.message}`);
    }

    const [favoriteErr, favoriteArtists] = await attemptPromise(async () =>
        maClient.getFavoriteArtists()
    );
    maClient.disconnect();

    if (favoriteErr !== undefined) {
        throw new Error(`Failed to get favorite artists: ${favoriteErr.message}`);
    }

    const existingTracks = currentTracks
        .filter(t => t !== trackToReplace)
        .map(t => `"${t.suggestion.title}" by ${t.suggestion.artist}`)
        .join("\n");

    const replacementPrompt = `Original playlist context: "${originalPrompt}" for playlist "${playlistName}"

Please suggest ONE alternative track to replace "${trackToReplace.suggestion.title}" by ${trackToReplace.suggestion.artist}.

The replacement should:
- Fit the same playlist context and mood
- Be a COMPLETELY DIFFERENT song/composition (not just a different version, cover, or recording of an existing track)
- Be from a different artist
- Maintain the overall flow and theme
- NOT be any of these tracks (or different versions/covers of them) already in the playlist:
${existingTracks}`;

    const [aiErr, aiResult] = await attemptPromise(async () =>
        generatePlaylistAI({
            prompt: replacementPrompt,
            favoriteArtists,
            providerConfig,
            customSystemPrompt,
            trackCount: 1
        })
    );

    if (aiErr !== undefined) {
        throw new Error(`Failed to get replacement track: ${aiErr.message}`);
    }

    if (aiResult.tracks.length === 0) {
        throw new Error("AI did not return a replacement track");
    }

    return {
        suggestion: aiResult.tracks[0],
        matched: false,
        matching: false
    };
};
