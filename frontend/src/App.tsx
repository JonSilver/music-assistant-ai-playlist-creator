import React, { useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { useAlerts } from './hooks/useAlerts';
import { usePlaylist } from './hooks/usePlaylist';
import { useHistoryAndPresets } from './hooks/useHistoryAndPresets';
import { useModals } from './hooks/useModals';
import { SettingsView } from './components/SettingsView';
import { MainView } from './components/MainView';

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

    useEffect(() => {
        void loadHistory();
        void loadPresets();
    }, [loadHistory, loadPresets]);

    const settingsComplete =
        settings !== null &&
        settings.musicAssistantUrl.trim().length > 0 &&
        settings.aiProviders.length > 0;

    const showSettingsPage = !settingsComplete || showSettings;

    return (
        <>
            {settingsLoading && (
                <div className="flex items-center justify-center min-h-screen">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}

            {!settingsLoading && showSettingsPage && (
                <SettingsView
                    settings={settings}
                    updateSettings={updateSettings}
                    setError={setError}
                    closeSettings={closeSettings}
                    error={error}
                    successMessage={successMessage}
                    clearError={clearError}
                    clearSuccess={clearSuccess}
                    settingsComplete={settingsComplete}
                />
            )}

            {!settingsLoading && !showSettingsPage && (
                <MainView
                    settings={settings}
                    selectedProviderId={selectedProviderId}
                    setSelectedProviderId={setSelectedProviderId}
                    error={error}
                    successMessage={successMessage}
                    clearError={clearError}
                    clearSuccess={clearSuccess}
                    presets={presets}
                    playlist={playlist}
                    history={history}
                    showHistory={showHistory}
                    showRefine={showRefine}
                    openSettings={openSettings}
                    openHistory={openHistory}
                    closeHistory={closeHistory}
                    openRefine={openRefine}
                    closeRefine={closeRefine}
                />
            )}
        </>
    );
};

export default App;
