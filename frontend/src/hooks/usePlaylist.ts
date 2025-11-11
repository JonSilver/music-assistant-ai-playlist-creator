import { useState, useCallback } from 'react';
import { attemptPromise } from '@jfdi/attempt';
import { useAlerts } from './useAlerts';
import { useApp } from '../contexts/AppContext';
import { useTrackReplace } from './useTrackReplace';
import { matchTracksProgressively } from '../services/trackMatching';
import { generatePlaylist as generatePlaylistService } from '../services/playlistGenerator';
import {
    createPlaylist as createPlaylistService,
    refinePlaylist as refinePlaylistService
} from '../services/playlistCreator';
import type { TrackMatch } from '@shared/types';

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
    trackFilter: 'all' | 'matched' | 'unmatched';
    setTrackFilter: (filter: 'all' | 'matched' | 'unmatched') => void;
    refinementPrompt: string;
    setRefinementPrompt: (value: string) => void;
    generatePlaylist: () => Promise<void>;
    createPlaylist: () => Promise<void>;
    refinePlaylist: () => Promise<void>;
    replaceTrack: (index: number) => Promise<void>;
    retryTrack: (index: number) => Promise<void>;
    removeTrack: (index: number) => void;
    clearTracks: () => void;
}

export const usePlaylist = (onHistoryUpdate: () => void): UsePlaylistReturn => {
    const { setError, setSuccess } = useAlerts();
    const { settings, selectedProviderId } = useApp();
    const [prompt, setPrompt] = useState('');
    const [playlistName, setPlaylistName] = useState('');
    const [trackCount, setTrackCount] = useState('25');
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [refining, setRefining] = useState(false);
    const [retryingTrackIndex, setRetryingTrackIndex] = useState<number | null>(null);
    const [generatedTracks, setGeneratedTracks] = useState<TrackMatch[]>([]);
    const [trackFilter, setTrackFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
    const [refinementPrompt, setRefinementPrompt] = useState('');

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
            setError('Please provide both a prompt and playlist name');
            return;
        }

        if (settings === null || settings.musicAssistantUrl.trim().length === 0) {
            setError('Music Assistant URL not configured');
            return;
        }

        if (settings.aiProviders.length === 0) {
            setError('No AI providers configured');
            return;
        }

        const providerId = selectedProviderId ?? settings.aiProviders[0].id;
        const providerConfig = settings.aiProviders.find(p => p.id === providerId);

        if (providerConfig === undefined) {
            setError('Selected AI provider not found');
            return;
        }

        setGeneratedTracks([]);
        setGenerating(true);

        const [err, unmatchedTracks] = await attemptPromise(async () =>
            generatePlaylistService({
                prompt,
                trackCount,
                musicAssistantUrl: settings.musicAssistantUrl,
                providerConfig,
                customSystemPrompt: settings.customSystemPrompt
            })
        );

        setGenerating(false);

        if (err !== undefined) {
            setError(`Failed to generate playlist: ${err.message}`);
            return;
        }

        setGeneratedTracks(unmatchedTracks);
        onHistoryUpdate();

        void matchTracksProgressively(
            unmatchedTracks,
            settings.musicAssistantUrl,
            setGeneratedTracks,
            setError
        );
    }, [prompt, playlistName, trackCount, settings, selectedProviderId, setError, onHistoryUpdate]);

    const createPlaylist = useCallback(async (): Promise<void> => {
        if (generatedTracks.length === 0) {
            setError('No tracks to create playlist from');
            return;
        }

        if (settings === null || settings.musicAssistantUrl.trim().length === 0) {
            setError('Music Assistant URL not configured');
            return;
        }

        setCreating(true);

        const [err, result] = await attemptPromise(async () =>
            createPlaylistService(playlistName, generatedTracks, settings.musicAssistantUrl)
        );

        setCreating(false);

        if (err !== undefined) {
            setError(`Failed to create playlist: ${err.message}`);
            return;
        }

        setSuccess(
            `Playlist created successfully! Added ${result.tracksAdded} tracks. [Open in Music Assistant](${result.playlistUrl})`
        );
        setPrompt('');
        setPlaylistName('');
        setGeneratedTracks([]);
    }, [generatedTracks, playlistName, settings, setError, setSuccess]);

    const refinePlaylist = useCallback(async (): Promise<void> => {
        if (refinementPrompt.trim().length === 0) {
            setError('Please provide refinement instructions');
            return;
        }

        if (settings === null || settings.musicAssistantUrl.trim().length === 0) {
            setError('Music Assistant URL not configured');
            return;
        }

        if (settings.aiProviders.length === 0) {
            setError('No AI providers configured');
            return;
        }

        const providerId = selectedProviderId ?? settings.aiProviders[0].id;
        const providerConfig = settings.aiProviders.find(p => p.id === providerId);

        if (providerConfig === undefined) {
            setError('Selected AI provider not found');
            return;
        }

        setRefining(true);

        const [err, unmatchedTracks] = await attemptPromise(async () =>
            refinePlaylistService(
                refinementPrompt,
                generatedTracks,
                settings.musicAssistantUrl,
                providerConfig,
                settings.customSystemPrompt
            )
        );

        setRefining(false);

        if (err !== undefined) {
            setError(`Failed to refine playlist: ${err.message}`);
            return;
        }

        setGeneratedTracks(unmatchedTracks);
        setRefinementPrompt('');

        void matchTracksProgressively(
            unmatchedTracks,
            settings.musicAssistantUrl,
            setGeneratedTracks,
            setError
        );
    }, [refinementPrompt, generatedTracks, settings, selectedProviderId, setError]);

    const retryTrack = useCallback(
        async (index: number): Promise<void> => {
            const track = generatedTracks[index];
            if (track === undefined || settings === null) return;

            setRetryingTrackIndex(index);
            setGeneratedTracks(prev => {
                const updated = [...prev];
                updated[index] = { ...track, matching: true, matched: false };
                return updated;
            });

            await matchTracksProgressively(
                [{ ...track, matching: true, matched: false }],
                settings.musicAssistantUrl,
                updater => {
                    setGeneratedTracks(prev => {
                        const matched = updater([track]);
                        const updated = [...prev];
                        updated[index] = matched[0] ?? track;
                        return updated;
                    });
                },
                setError
            );

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
        clearTracks
    };
};
