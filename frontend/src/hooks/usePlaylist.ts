/* eslint-disable max-lines */
import { useState, useCallback } from "react";
import { attemptPromise } from "@jfdi/attempt";
import { useAlerts } from "./useAlerts";
import { useApp } from "../contexts/AppContext";
import { useTrackReplace } from "./useTrackReplace";
import {
    generatePlaylistViaBackend,
    createPlaylistViaBackend,
    refinePlaylistViaBackend,
    retryTrackViaBackend
} from "../services/playlistApi";
import type { TrackMatch } from "@shared/types";
import { parseProviderKeywords } from "../utils/parseProviderKeywords";

export interface UsePlaylistReturn {
    prompt: string;
    setPrompt: (value: string) => void;
    playlistName: string;
    setPlaylistName: (value: string) => void;
    trackCount: string;
    setTrackCount: (value: string) => void;
    generating: boolean;
    creating: boolean;
    refining: boolean;
    replacingTrackIndex: number | null;
    retryingTrackIndex: number | null;
    generatedTracks: TrackMatch[];
    setGeneratedTracks: (tracks: TrackMatch[]) => void;
    trackFilter: "all" | "matched" | "unmatched";
    setTrackFilter: (filter: "all" | "matched" | "unmatched") => void;
    refinementPrompt: string;
    setRefinementPrompt: (value: string) => void;
    generatePlaylist: () => Promise<void>;
    createPlaylist: () => Promise<void>;
    refinePlaylist: () => Promise<void>;
    replaceTrack: (index: number) => Promise<void>;
    retryTrack: (index: number) => Promise<void>;
    removeTrack: (index: number) => void;
    selectMatch: (trackIndex: number, matchIndex: number) => void;
    clearTracks: () => void;
}

export const usePlaylist = (onHistoryUpdate: () => void): UsePlaylistReturn => {
    const { setError, setSuccess } = useAlerts();
    const { settings, selectedProviderId } = useApp();
    const [prompt, setPrompt] = useState("");
    const [playlistName, setPlaylistName] = useState("");
    const [trackCount, setTrackCount] = useState("25");
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [refining, setRefining] = useState(false);
    const [retryingTrackIndex, setRetryingTrackIndex] = useState<number | null>(null);
    const [generatedTracks, setGeneratedTracks] = useState<TrackMatch[]>([]);
    const [trackFilter, setTrackFilter] = useState<"all" | "matched" | "unmatched">("all");
    const [refinementPrompt, setRefinementPrompt] = useState("");

    const { replacingTrackIndex, replaceTrack } = useTrackReplace(
        generatedTracks,
        prompt,
        playlistName,
        settings,
        selectedProviderId,
        setGeneratedTracks,
        setError
    );

    const generatePlaylist = useCallback(async (): Promise<void> => {
        if (prompt.trim().length === 0 || playlistName.trim().length === 0) {
            setError("Please provide both a prompt and playlist name");
            return;
        }

        if (settings === null || settings.musicAssistantUrl.trim().length === 0) {
            setError("Music Assistant URL not configured");
            return;
        }

        if (settings.aiProviders.length === 0) {
            setError("No AI providers configured");
            return;
        }

        const providerId = selectedProviderId ?? settings.aiProviders[0].id;

        setGeneratedTracks([]);
        setGenerating(true);

        const [err] = await attemptPromise(async () =>
            generatePlaylistViaBackend(
                {
                    prompt,
                    providerPreference: providerId,
                    trackCount: parseInt(trackCount, 10)
                },
                update => {
                    // Update tracks progressively as they're matched
                    if (update.tracks !== undefined) {
                        setGeneratedTracks(update.tracks);
                    }
                }
            )
        );

        setGenerating(false);

        if (err !== undefined) {
            setError(`Failed to generate playlist: ${err.message}`);
            return;
        }

        onHistoryUpdate();
    }, [prompt, playlistName, settings, selectedProviderId, trackCount, setError, onHistoryUpdate]);

    const createPlaylist = useCallback(async (): Promise<void> => {
        if (generatedTracks.length === 0) {
            setError("No tracks to create playlist from");
            return;
        }

        if (settings === null || settings.musicAssistantUrl.trim().length === 0) {
            setError("Music Assistant URL not configured");
            return;
        }

        setCreating(true);

        const [err, result] = await attemptPromise(async () =>
            createPlaylistViaBackend(playlistName, prompt, generatedTracks)
        );

        setCreating(false);

        if (err !== undefined) {
            setError(`Failed to create playlist: ${err.message}`);
            return;
        }

        setSuccess(
            `Playlist created successfully! Added ${result.tracksAdded} tracks. [Open in Music Assistant](${result.playlistUrl})`
        );
        setPrompt("");
        setPlaylistName("");
        setGeneratedTracks([]);
        onHistoryUpdate();
    }, [generatedTracks, playlistName, prompt, settings, setError, setSuccess, onHistoryUpdate]);

    const refinePlaylist = useCallback(async (): Promise<void> => {
        if (refinementPrompt.trim().length === 0) {
            setError("Please provide refinement instructions");
            return;
        }

        if (settings === null) {
            setError("Settings not loaded");
            return;
        }

        if (settings.aiProviders.length === 0) {
            setError("No AI providers configured");
            return;
        }

        const providerId = selectedProviderId ?? settings.aiProviders[0].id;

        setRefining(true);

        const [err, refinedTracks] = await attemptPromise(async () =>
            refinePlaylistViaBackend(refinementPrompt, generatedTracks, providerId)
        );

        setRefining(false);

        if (err !== undefined) {
            setError(`Failed to refine playlist: ${err.message}`);
            return;
        }

        setGeneratedTracks(refinedTracks);
        setRefinementPrompt("");
    }, [refinementPrompt, generatedTracks, settings, selectedProviderId, setError]);

    const retryTrack = useCallback(
        async (index: number): Promise<void> => {
            const track = generatedTracks[index];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (track === undefined || settings === null) return;

            setRetryingTrackIndex(index);
            setGeneratedTracks(prev => {
                const updated = [...prev];
                updated[index] = { ...track, matching: true, matched: false };
                return updated;
            });

            const providerKeywords = parseProviderKeywords(settings.providerWeights);
            const [err, matchedTrack] = await attemptPromise(async () =>
                retryTrackViaBackend(track, providerKeywords)
            );

            if (err !== undefined) {
                setError(`Failed to retry track: ${err.message}`);
                setGeneratedTracks(prev => {
                    const updated = [...prev];
                    updated[index] = { ...track, matching: false };
                    return updated;
                });
            } else {
                setGeneratedTracks(prev => {
                    const updated = [...prev];
                    updated[index] = { ...matchedTrack, matching: false };
                    return updated;
                });
            }

            setRetryingTrackIndex(null);
        },
        [generatedTracks, settings, setError]
    );

    const removeTrack = useCallback((index: number): void => {
        setGeneratedTracks(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearTracks = useCallback((): void => {
        setGeneratedTracks([]);
    }, []);

    const selectMatch = useCallback((trackIndex: number, matchIndex: number): void => {
        setGeneratedTracks(prev => {
            const updated = [...prev];
            const track = updated[trackIndex];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (track?.maMatches === undefined) return prev;

            const selectedMatch = track.maMatches[matchIndex];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (selectedMatch === undefined) return prev;

            updated[trackIndex] = {
                ...track,
                selectedMatchIndex: matchIndex,
                maTrack: selectedMatch
            };
            return updated;
        });
    }, []);

    return {
        prompt,
        setPrompt,
        playlistName,
        setPlaylistName,
        trackCount,
        setTrackCount,
        generating,
        creating,
        refining,
        replacingTrackIndex,
        retryingTrackIndex,
        generatedTracks,
        setGeneratedTracks,
        trackFilter,
        setTrackFilter,
        refinementPrompt,
        setRefinementPrompt,
        generatePlaylist,
        createPlaylist,
        refinePlaylist,
        replaceTrack,
        retryTrack,
        removeTrack,
        selectMatch,
        clearTracks
    };
};
