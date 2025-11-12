import { useState, useCallback } from "react";
import { attemptPromise } from "@jfdi/attempt";
import { matchTracksProgressively } from "../services/trackMatching";
import { replaceTrack as replaceTrackService } from "../services/playlistCreator";
import type { TrackMatch, GetSettingsResponse } from "@shared/types";

interface UseTrackReplaceReturn {
    replacingTrackIndex: number | null;
    replaceTrack: (index: number) => Promise<void>;
}

export const useTrackReplace = (
    generatedTracks: TrackMatch[],
    prompt: string,
    playlistName: string,
    settings: GetSettingsResponse | null,
    selectedProviderId: string | null,
    setGeneratedTracks: (
        tracksOrUpdater: TrackMatch[] | ((prev: TrackMatch[]) => TrackMatch[])
    ) => void,
    setError: (message: string) => void
): UseTrackReplaceReturn => {
    const [replacingTrackIndex, setReplacingTrackIndex] = useState<number | null>(null);

    const replaceTrack = useCallback(
        async (index: number): Promise<void> => {
            if (settings === null) {
                setError("Settings not loaded");
                return;
            }

            if (settings.aiProviders.length === 0) {
                setError("No AI providers configured");
                return;
            }

            const providerId = selectedProviderId ?? settings.aiProviders[0].id;
            const providerConfig = settings.aiProviders.find(p => p.id === providerId);

            if (providerConfig === undefined) {
                setError("Selected AI provider not found");
                return;
            }

            if (index < 0 || index >= generatedTracks.length) return;

            const trackToReplace = generatedTracks[index];
            console.log(`[Replace] Replacing track at index ${index}:`, trackToReplace.suggestion);
            console.log(`[Replace] Current playlist has ${generatedTracks.length} tracks`);
            setReplacingTrackIndex(index);

            const [err, replacementTrack] = await attemptPromise(async () =>
                replaceTrackService(
                    trackToReplace,
                    generatedTracks,
                    prompt,
                    playlistName,
                    settings.musicAssistantUrl,
                    providerConfig,
                    settings.customSystemPrompt
                )
            );

            setReplacingTrackIndex(null);

            if (err !== undefined) {
                setError(`Failed to replace track: ${err.message}`);
                return;
            }

            console.log(
                `[Replace] Got replacement for index ${index}:`,
                replacementTrack.suggestion
            );

            setGeneratedTracks(prev => {
                console.log(
                    `[Replace] Updating state at index ${index}, current array length:`,
                    prev.length
                );
                const updated = [
                    ...prev.slice(0, index),
                    replacementTrack,
                    ...prev.slice(index + 1)
                ];
                console.log(`[Replace] Updated array length:`, updated.length);
                return updated;
            });

            void matchTracksProgressively(
                [replacementTrack],
                settings.musicAssistantUrl,
                updater => {
                    console.log(`[Replace] Matching callback for index ${index}`);
                    const matchedTrack = updater([replacementTrack])[0] ?? replacementTrack;
                    console.log(
                        `[Replace] Matched track for index ${index}:`,
                        matchedTrack.suggestion
                    );
                    setGeneratedTracks(prev => {
                        console.log(
                            `[Replace] Final update at index ${index}, prev length:`,
                            prev.length
                        );
                        const updated = [
                            ...prev.slice(0, index),
                            matchedTrack,
                            ...prev.slice(index + 1)
                        ];
                        console.log(`[Replace] Final updated length:`, updated.length);
                        return updated;
                    });
                },
                setError
            );
        },
        [
            generatedTracks,
            prompt,
            playlistName,
            settings,
            selectedProviderId,
            setError,
            setGeneratedTracks
        ]
    );

    return { replacingTrackIndex, replaceTrack };
};
