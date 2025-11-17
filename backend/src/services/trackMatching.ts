import { attemptPromise } from "@jfdi/attempt";
import type { TrackMatch, TrackSuggestion } from "../../../shared/types.js";
import { sortByProviderWeight } from "../utils/sortByProviderWeight.js";
import type { MusicAssistantClient } from "./musicAssistant.js";

export const matchTrack = async (
    suggestion: TrackSuggestion,
    maClient: MusicAssistantClient,
    providerKeywords: string[] = []
): Promise<TrackMatch> => {
    const startTime = performance.now();
    console.log(
        `[${new Date().toISOString()}] [MATCH] Searching: "${suggestion.title}" by "${suggestion.artist}"`
    );

    const trySearch = async (attempt: number): Promise<TrackMatch> => {
        const attemptStart = performance.now();
        const searchLimit = 5;
        const [err, results] = await attemptPromise(async () =>
            maClient.searchTracks(suggestion.title, suggestion.artist, searchLimit)
        );
        const attemptDuration = performance.now() - attemptStart;
        const attemptDurationMs = Math.round(attemptDuration);

        if (err !== undefined || results.length === 0) {
            const reason = err !== undefined ? err.message : "No results";
            console.warn(
                `[${new Date().toISOString()}] [MATCH] Attempt ${attempt}/3 failed after ${attemptDurationMs}ms: ${reason}`
            );

            if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                return trySearch(attempt + 1);
            }

            const totalDuration = performance.now() - startTime;
            const totalDurationMs = Math.round(totalDuration);
            console.error(
                `[${new Date().toISOString()}] [MATCH] ❌ Failed after 3 attempts (${totalDurationMs}ms total): "${suggestion.title}" by "${suggestion.artist}"`,
                reason
            );
            return {
                suggestion,
                matched: false
            };
        }

        // Sort results by provider preference
        const sortedResults = sortByProviderWeight(results, providerKeywords);

        const match = sortedResults[0];
        const matchedArtist = match.artists.length > 0 ? match.artists[0].name : "unknown";
        const totalDuration = performance.now() - startTime;
        const durationMs = Math.round(totalDuration);
        const multipleMatches =
            sortedResults.length > 1 ? ` (${sortedResults.length} matches)` : "";
        console.log(
            `[${new Date().toISOString()}] [MATCH] ✓ "${match.name}" by "${matchedArtist}" (${durationMs}ms)${multipleMatches}`
        );

        return {
            suggestion,
            matched: true,
            maTrack: match,
            maMatches: sortedResults.length > 1 ? sortedResults : undefined,
            selectedMatchIndex: 0
        };
    };

    return trySearch(1);
};

export const matchTracksProgressively = async (
    tracks: TrackMatch[],
    maClient: MusicAssistantClient,
    onUpdate: (index: number, track: TrackMatch) => void,
    providerKeywords: string[] = []
): Promise<void> => {
    const BATCH_SIZE = 10;

    const processBatch = async (batch: TrackMatch[], startIndex: number): Promise<void> => {
        await Promise.all(
            batch.map(async (track, batchIdx) => {
                const index = startIndex + batchIdx;

                // Mark as matching
                onUpdate(index, { ...track, matching: true });

                const [err, matchedTrack] = await attemptPromise(async () =>
                    matchTrack(track.suggestion, maClient, providerKeywords)
                );

                if (err === undefined) {
                    onUpdate(index, { ...matchedTrack, matching: false });
                } else {
                    onUpdate(index, { ...track, matching: false });
                }
            })
        );
    };

    const batches = tracks.reduce<TrackMatch[][]>((acc, track, index) => {
        const batchIndex = Math.floor(index / BATCH_SIZE);
        const currentBatch = acc[batchIndex] ?? [];
        const updatedBatch = [...currentBatch, track];
        const updatedBatches = [...acc];
        updatedBatches[batchIndex] = updatedBatch;
        return updatedBatches;
    }, []);

    await batches.reduce(async (prevPromise, batch, batchNum) => {
        await prevPromise;
        await processBatch(batch, batchNum * BATCH_SIZE);
        if (batchNum < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }, Promise.resolve());
};
