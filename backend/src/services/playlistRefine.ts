import { attemptPromise } from "@jfdi/attempt";
import type { AIProviderConfig, TrackMatch } from "../../../shared/types.js";
import { generatePlaylist as generatePlaylistAI } from "./ai.js";
import { MusicAssistantClient } from "./musicAssistant.js";
import { matchTracksProgressively } from "./trackMatching.js";
import { createUnmatchedTracks } from "../utils/trackUtils.js";

export const refinePlaylist = async (
    refinementPrompt: string,
    currentTracks: TrackMatch[],
    musicAssistantUrl: string,
    providerConfig: AIProviderConfig,
    customSystemPrompt?: string
): Promise<TrackMatch[]> => {
    const maClient = new MusicAssistantClient(musicAssistantUrl);
    await maClient.connect();

    const [favoriteErr, favoriteArtists] = await attemptPromise(async () =>
        maClient.getFavoriteArtists()
    );

    if (favoriteErr !== undefined) {
        maClient.disconnect();
        throw new Error(`Failed to get favorite artists: ${favoriteErr.message}`);
    }

    const trackList = currentTracks.map(
        (m: TrackMatch) => `${m.suggestion.title} by ${m.suggestion.artist}`
    );

    // Check if this is an "add" request
    const isAddRequest = /\b(add|append|include)\b/i.test(refinementPrompt);

    const refinementContext = isAddRequest
        ? `Current playlist:\n${trackList.join("\n")}\n\n${refinementPrompt.trim()}\n\nReturn ONLY the new tracks to add, not the existing ones.`
        : `Current playlist:\n${trackList.join("\n")}\n\nRefinement request: ${refinementPrompt.trim()}`;

    const [aiErr, aiResult] = await attemptPromise(async () =>
        generatePlaylistAI({
            prompt: refinementContext,
            favoriteArtists,
            providerConfig,
            customSystemPrompt
        })
    );

    if (aiErr !== undefined) {
        maClient.disconnect();
        throw new Error(`Failed to refine playlist: ${aiErr.message}`);
    }

    // Initialise tracks - all marked as matching since we'll process them all
    const newTracks: TrackMatch[] = createUnmatchedTracks(aiResult.tracks);

    // Use the same matching logic as main generation
    await matchTracksProgressively(
        newTracks,
        maClient,
        (index, updatedTrack) => {
            newTracks[index] = updatedTrack;
        },
        []
    );

    maClient.disconnect();

    // If it's an add request, append to existing tracks; otherwise replace
    return isAddRequest ? [...currentTracks, ...newTracks] : newTracks;
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
    const maClient = new MusicAssistantClient(musicAssistantUrl);
    await maClient.connect();

    const [favoriteErr, favoriteArtists] = await attemptPromise(async () =>
        maClient.getFavoriteArtists()
    );

    if (favoriteErr !== undefined) {
        maClient.disconnect();
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
        maClient.disconnect();
        throw new Error(`Failed to get replacement track: ${aiErr.message}`);
    }

    if (aiResult.tracks.length === 0) {
        maClient.disconnect();
        throw new Error("AI did not return a replacement track");
    }

    // Initialise and match the replacement track
    const replacementTracks: TrackMatch[] = createUnmatchedTracks([aiResult.tracks[0]]);

    // Use the same matching logic as main generation
    await matchTracksProgressively(
        replacementTracks,
        maClient,
        (index, updatedTrack) => {
            replacementTracks[index] = updatedTrack;
        },
        []
    );

    maClient.disconnect();

    return replacementTracks[0];
};
