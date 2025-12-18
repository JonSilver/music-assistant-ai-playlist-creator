import type { AIProviderConfig, GetSettingsResponse } from '@shared/types';
import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { AlertMessage } from './AlertMessage';
import { SettingsPage } from './SettingsPage';

interface ISettingsViewProps {
    settings: GetSettingsResponse | null;
    updateSettings: (updates: {
        musicAssistantUrl: string;
        musicAssistantToken?: string;
        aiProviders: AIProviderConfig[];
        customSystemPrompt?: string;
        providerWeights?: string;
        defaultProviderId?: string;
    }) => Promise<Error | undefined>;
    setError: (message: string) => void;
    closeSettings: () => void;
    error: string | null;
    successMessage: string | null;
    clearError: () => void;
    clearSuccess: () => void;
    settingsComplete: boolean;
}

export const SettingsView: React.FC<ISettingsViewProps> = ({
    settings,
    updateSettings,
    setError,
    closeSettings,
    error,
    successMessage,
    clearError,
    clearSuccess,
    settingsComplete
}) => {
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
                musicAssistantToken={settingsManager.musicAssistantToken}
                setMusicAssistantToken={settingsManager.setMusicAssistantToken}
                aiProviders={settingsManager.aiProviders}
                setAiProviders={settingsManager.setAiProviders}
                customSystemPrompt={settingsManager.customSystemPrompt}
                setCustomSystemPrompt={settingsManager.setCustomSystemPrompt}
                providerWeights={settingsManager.providerWeights}
                setProviderWeights={settingsManager.setProviderWeights}
                defaultProviderId={settingsManager.defaultProviderId}
                setDefaultProviderId={settingsManager.setDefaultProviderId}
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
