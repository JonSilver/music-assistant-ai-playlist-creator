import React, { useEffect, useCallback, useState } from 'react';
import { useApp } from './contexts/AppContext';
import { useAlerts } from './hooks/useAlerts';
import { usePlaylist } from './hooks/usePlaylist';
import { useHistoryAndPresets } from './hooks/useHistoryAndPresets';
import { useModals } from './hooks/useModals';
import type { AIProviderConfig } from '../../shared/types';
import { Navbar } from './components/Navbar';
import { AlertMessage } from './components/AlertMessage';
import { PresetPrompts } from './components/PresetPrompts';
import { PlaylistCreatorForm } from './components/PlaylistCreatorForm';
import { GeneratedTracksDisplay } from './components/GeneratedTracksDisplay';
import { SettingsPage } from './components/SettingsPage';
import { HistoryModal } from './components/HistoryModal';
import { RefinePlaylistModal } from './components/RefinePlaylistModal';
import { MusicAssistantClient } from './services/musicAssistant';
import { attemptPromise } from '@jfdi/attempt';

const App = (): React.JSX.Element => {
    const {
        settings,
        updateSettings,
        loading: settingsLoading,
        selectedProviderId,
        setSelectedProviderId
    } = useApp();
    const { error, successMessage, setError, clearError, clearSuccess } = useAlerts();
    const historyAndPresetsResult = useHistoryAndPresets();
    const {
        showSettings,
        showHistory,
        showRefine,
        openSettings,
        closeSettings,
        openHistory,
        closeHistory,
        openRefine,
        closeRefine
    } = useModals();

    const { history, presets, loadHistory, loadPresets } = historyAndPresetsResult;

    const playlist = usePlaylist(() => {
        void loadHistory();
    });

    // Local state for settings form
    const [musicAssistantUrl, setMusicAssistantUrl] = useState('');
    const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
    const [customSystemPrompt, setCustomSystemPrompt] = useState('');
    const [testingMA, setTestingMA] = useState(false);
    const [testResults, setTestResults] = useState<{
        ma?: { success: boolean; error?: string };
    }>({});

    // Sync form state with settings
    useEffect(() => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? '');
        }
    }, [settings]);

    useEffect(() => {
        void loadHistory();
        void loadPresets();
    }, [loadHistory, loadPresets]);

    // Check if settings are complete
    const settingsComplete =
        settings !== null &&
        settings.musicAssistantUrl.trim().length > 0 &&
        settings.aiProviders.length > 0;

    // Show settings page if settings incomplete OR user opened settings
    const showSettingsPage = !settingsComplete || showSettings;

    const testMA = async (): Promise<void> => {
        setTestingMA(true);
        setTestResults({ ...testResults, ma: undefined });

        const [err] = await attemptPromise(async () => {
            const client = new MusicAssistantClient(musicAssistantUrl);
            await client.connect();
            client.disconnect();
        });

        if (err !== undefined) {
            setTestResults({ ...testResults, ma: { success: false, error: err.message } });
        } else {
            setTestResults({ ...testResults, ma: { success: true } });
        }

        setTestingMA(false);
    };

    const handleSaveSettings = useCallback(async (): Promise<void> => {
        if (musicAssistantUrl.trim().length === 0) {
            setError('Music Assistant URL is required');
            return;
        }

        if (aiProviders.length === 0) {
            setError('At least one AI provider is required');
            return;
        }

        const err = await updateSettings({
            musicAssistantUrl,
            aiProviders,
            customSystemPrompt:
                customSystemPrompt.trim().length > 0 ? customSystemPrompt : undefined
        });

        if (err !== undefined) {
            setError(`Failed to save settings: ${err.message}`);
            return;
        }

        closeSettings();
    }, [
        musicAssistantUrl,
        aiProviders,
        customSystemPrompt,
        updateSettings,
        setError,
        closeSettings
    ]);

    const handleCancelSettings = useCallback((): void => {
        // Reset form to saved settings
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? '');
        }
        closeSettings();
    }, [settings, closeSettings]);

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (showSettingsPage) {
        return (
            <>
                {error !== null && (
                    <AlertMessage type="error" message={error} onDismiss={clearError} />
                )}
                {successMessage !== null && (
                    <AlertMessage
                        type="success"
                        message={successMessage}
                        onDismiss={clearSuccess}
                    />
                )}
                <SettingsPage
                    musicAssistantUrl={musicAssistantUrl}
                    setMusicAssistantUrl={setMusicAssistantUrl}
                    aiProviders={aiProviders}
                    setAiProviders={setAiProviders}
                    customSystemPrompt={customSystemPrompt}
                    setCustomSystemPrompt={setCustomSystemPrompt}
                    testingMA={testingMA}
                    testResults={testResults}
                    testMA={testMA}
                    onSave={handleSaveSettings}
                    onCancel={settingsComplete ? handleCancelSettings : undefined}
                    showCancel={settingsComplete}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar onShowSettings={openSettings} onShowHistory={openHistory} />

            {error !== null && <AlertMessage type="error" message={error} onDismiss={clearError} />}
            {successMessage !== null && (
                <AlertMessage type="success" message={successMessage} onDismiss={clearSuccess} />
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <PresetPrompts
                        presets={presets}
                        onSelectPreset={preset => {
                            playlist.setPrompt(preset.prompt);
                        }}
                    />

                    <PlaylistCreatorForm
                        playlistName={playlist.playlistName}
                        prompt={playlist.prompt}
                        trackCount={playlist.trackCount}
                        generating={playlist.generating}
                        providers={settings?.aiProviders ?? []}
                        selectedProviderId={selectedProviderId}
                        onPlaylistNameChange={playlist.setPlaylistName}
                        onPromptChange={playlist.setPrompt}
                        onTrackCountChange={playlist.setTrackCount}
                        onProviderChange={setSelectedProviderId}
                        onGenerate={playlist.generatePlaylist}
                    />

                    {playlist.generatedTracks.length > 0 && (
                        <GeneratedTracksDisplay
                            tracks={playlist.generatedTracks}
                            creating={playlist.creating}
                            replacingTrackIndex={playlist.replacingTrackIndex}
                            retryingTrackIndex={playlist.retryingTrackIndex}
                            trackFilter={playlist.trackFilter}
                            onTrackFilterChange={playlist.setTrackFilter}
                            onReplaceTrack={(index: number) => {
                                void playlist.replaceTrack(index);
                            }}
                            onRetryTrack={(index: number) => {
                                void playlist.retryTrack(index);
                            }}
                            onRemoveTrack={playlist.removeTrack}
                            onClear={playlist.clearTracks}
                            onRefine={openRefine}
                            onCreate={() => {
                                void playlist.createPlaylist();
                            }}
                        />
                    )}
                </div>
            </div>

            <HistoryModal
                show={showHistory}
                history={history}
                onClose={closeHistory}
                onSelectHistory={(item: { prompt: string; playlistName?: string }) => {
                    playlist.setPrompt(item.prompt);
                    if (item.playlistName !== undefined) {
                        playlist.setPlaylistName(item.playlistName);
                    }
                    closeHistory();
                }}
            />

            <RefinePlaylistModal
                show={showRefine}
                onClose={closeRefine}
                refinementPrompt={playlist.refinementPrompt}
                onRefinementPromptChange={playlist.setRefinementPrompt}
                refining={playlist.refining}
                onRefine={() => {
                    void playlist.refinePlaylist();
                }}
            />
        </div>
    );
};

export default App;
