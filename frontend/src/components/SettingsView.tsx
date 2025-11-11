import React from 'react';
import type { GetSettingsResponse } from '@shared/types';
import { useSettings } from '../hooks/useSettings';
import { AlertMessage } from './AlertMessage';
import { SettingsPage } from './SettingsPage';

interface SettingsViewProps {
    settings: GetSettingsResponse | null;
    updateSettings: (updates: {
        musicAssistantUrl: string;
        aiProviders: import('@shared/types').AIProviderConfig[];
        customSystemPrompt?: string;
    }) => Promise<Error | undefined>;
    setError: (message: string) => void;
    closeSettings: () => void;
    error: string | null;
    successMessage: string | null;
    clearError: () => void;
    clearSuccess: () => void;
    settingsComplete: boolean;
}

export const SettingsView = ({
    settings,
    updateSettings,
    setError,
    closeSettings,
    error,
    successMessage,
    clearError,
    clearSuccess,
    settingsComplete
}: SettingsViewProps): React.JSX.Element => {
    const settingsManager = useSettings(settings, updateSettings, setError, closeSettings);

    return (
        <>
            {error !== null && <AlertMessage type="error" message={error} onDismiss={clearError} />}
            {successMessage !== null && (
                <AlertMessage type="success" message={successMessage} onDismiss={clearSuccess} />
            )}
            <SettingsPage
                musicAssistantUrl={settingsManager.musicAssistantUrl}
                setMusicAssistantUrl={settingsManager.setMusicAssistantUrl}
                aiProviders={settingsManager.aiProviders}
                setAiProviders={settingsManager.setAiProviders}
                customSystemPrompt={settingsManager.customSystemPrompt}
                setCustomSystemPrompt={settingsManager.setCustomSystemPrompt}
                testingMA={settingsManager.testingMA}
                testResults={settingsManager.testResults}
                testMA={settingsManager.testMA}
                onSave={() => {
                    void settingsManager.handleSaveSettings();
                }}
                onCancel={settingsComplete ? settingsManager.handleCancelSettings : undefined}
                showCancel={settingsComplete}
            />
        </>
    );
};
