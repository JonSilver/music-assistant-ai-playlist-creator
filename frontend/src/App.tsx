import React, { useEffect, useCallback } from 'react';
import { useApp } from './contexts/AppContext';
import { useAlerts } from './hooks/useAlerts';
import { usePlaylist } from './hooks/usePlaylist';
import { useSettingsForm } from './hooks/useSettingsForm';
import { useHistoryAndPresets } from './hooks/useHistoryAndPresets';
import { useModals } from './hooks/useModals';
import type { PromptHistory, PresetPrompt } from '../../shared/types';
import { Navbar } from './components/Navbar';
import { AlertMessage } from './components/AlertMessage';
import { PresetPrompts } from './components/PresetPrompts';
import { PlaylistCreatorForm } from './components/PlaylistCreatorForm';
import { GeneratedTracksDisplay } from './components/GeneratedTracksDisplay';
import { SettingsPage } from './components/SettingsPage';
import { HistoryModal } from './components/HistoryModal';
import { RefinePlaylistModal } from './components/RefinePlaylistModal';

const App = (): React.JSX.Element => {
    const { settings, updateSettings, loading: settingsLoading } = useApp();
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
    const settingsForm = useSettingsForm(settings);

    useEffect(() => {
        void loadHistory();
        void loadPresets();
    }, [loadHistory, loadPresets]);

    // Check if settings are complete
    const settingsComplete =
        settings !== null &&
        settings.musicAssistantUrl.trim().length > 0 &&
        ((settings.aiProvider === 'claude' &&
            settings.anthropicApiKey !== undefined &&
            settings.anthropicApiKey.trim().length > 0) ||
            (settings.aiProvider === 'openai' &&
                settings.openaiApiKey !== undefined &&
                settings.openaiApiKey.trim().length > 0));

    // Show settings page if settings incomplete OR user opened settings
    const showSettingsPage = !settingsComplete || showSettings;

    const handleSaveSettings = useCallback(async (): Promise<void> => {
        if (settingsForm.musicAssistantUrl.trim().length === 0) {
            setError('Music Assistant URL is required');
            return;
        }

        if (
            settingsForm.aiProvider === 'claude' &&
            settingsForm.anthropicApiKey.trim().length === 0
        ) {
            setError('Anthropic API Key is required when using Claude');
            return;
        }

        if (settingsForm.aiProvider === 'openai' && settingsForm.openaiApiKey.trim().length === 0) {
            setError('OpenAI API Key is required when using OpenAI');
            return;
        }

        const err = await updateSettings({
            musicAssistantUrl:
                settingsForm.musicAssistantUrl.length > 0
                    ? settingsForm.musicAssistantUrl
                    : undefined,
            aiProvider: settingsForm.aiProvider,
            anthropicApiKey:
                settingsForm.anthropicApiKey.length > 0 ? settingsForm.anthropicApiKey : undefined,
            anthropicModel:
                settingsForm.anthropicModel.length > 0 ? settingsForm.anthropicModel : undefined,
            openaiApiKey:
                settingsForm.openaiApiKey.length > 0 ? settingsForm.openaiApiKey : undefined,
            openaiModel: settingsForm.openaiModel.length > 0 ? settingsForm.openaiModel : undefined,
            openaiBaseUrl:
                settingsForm.openaiBaseUrl.length > 0 ? settingsForm.openaiBaseUrl : undefined,
            customSystemPrompt:
                settingsForm.customSystemPrompt.length > 0
                    ? settingsForm.customSystemPrompt
                    : undefined,
            temperature:
                settingsForm.temperature.length > 0
                    ? parseFloat(settingsForm.temperature)
                    : undefined
        });

        if (err !== undefined) {
            setError(`Failed to save settings: ${err.message}`);
            return;
        }

        closeSettings();
    }, [settingsForm, updateSettings, setError, closeSettings]);

    const handleCancelSettings = useCallback((): void => {
        if (!settingsComplete) {
            setError('Please complete required settings');
            return;
        }
        closeSettings();
    }, [settingsComplete, setError, closeSettings]);

    const handleUsePreset = useCallback(
        (preset: PresetPrompt): void => {
            playlist.setPrompt(preset.prompt);
            // Only set playlist name if it's currently empty
            if (playlist.playlistName.trim().length === 0) {
                playlist.setPlaylistName(preset.name);
            }
        },
        [playlist]
    );

    const handleUseHistory = useCallback(
        (item: PromptHistory): void => {
            playlist.setPrompt(item.prompt);
            if (item.playlistName !== undefined) {
                playlist.setPlaylistName(item.playlistName);
            }
            closeHistory();
        },
        [playlist, closeHistory]
    );

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    // Show settings page if needed
    if (showSettingsPage) {
        return (
            <>
                {error !== null && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                        <AlertMessage type="error" message={error} onDismiss={clearError} />
                    </div>
                )}
                <SettingsPage
                    {...settingsForm}
                    onSave={() => {
                        void handleSaveSettings();
                    }}
                    onCancel={handleCancelSettings}
                    showCancel={settingsComplete}
                />
            </>
        );
    }

    // Show main UI
    return (
        <div className="min-h-screen bg-base-200">
            <Navbar onShowHistory={openHistory} onShowSettings={openSettings} />

            <div className="container mx-auto p-4 max-w-6xl">
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

                <PresetPrompts presets={presets} onSelectPreset={handleUsePreset} />

                <PlaylistCreatorForm
                    playlistName={playlist.playlistName}
                    prompt={playlist.prompt}
                    trackCount={playlist.trackCount}
                    generating={playlist.generating}
                    aiProvider={settings !== null ? settings.aiProvider : 'claude'}
                    onPlaylistNameChange={playlist.setPlaylistName}
                    onPromptChange={playlist.setPrompt}
                    onTrackCountChange={playlist.setTrackCount}
                    onGenerate={() => {
                        void playlist.generatePlaylist();
                    }}
                />

                {playlist.generatedTracks.length > 0 && (
                    <GeneratedTracksDisplay
                        tracks={playlist.generatedTracks}
                        creating={playlist.creating}
                        replacingTrackIndex={playlist.replacingTrackIndex}
                        retryingTrackIndex={playlist.retryingTrackIndex}
                        trackFilter={playlist.trackFilter}
                        onTrackFilterChange={playlist.setTrackFilter}
                        onReplaceTrack={playlist.replaceTrack}
                        onRetryTrack={playlist.retryTrack}
                        onRemoveTrack={playlist.removeTrack}
                        onClear={playlist.clearTracks}
                        onRefine={openRefine}
                        onCreate={() => {
                            void playlist.createPlaylist();
                        }}
                    />
                )}
            </div>

            <HistoryModal
                show={showHistory}
                onClose={closeHistory}
                history={history}
                onSelectHistory={handleUseHistory}
            />

            <RefinePlaylistModal
                show={showRefine}
                onClose={() => {
                    closeRefine();
                    playlist.setRefinementPrompt('');
                }}
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
