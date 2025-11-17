import { useState, useEffect, useCallback } from "react";
import type { AIProviderConfig, GetSettingsResponse } from "@shared/types";
import { testMusicAssistantConnection } from "../services/playlistApi";

interface TestResults {
    ma?: { success: boolean; error?: string };
}

interface UseSettingsReturn {
    musicAssistantUrl: string;
    setMusicAssistantUrl: (url: string) => void;
    aiProviders: AIProviderConfig[];
    setAiProviders: (providers: AIProviderConfig[]) => void;
    customSystemPrompt: string;
    setCustomSystemPrompt: (prompt: string) => void;
    providerWeights: string;
    setProviderWeights: (weights: string) => void;
    testingMA: boolean;
    testResults: TestResults;
    testMA: () => Promise<void>;
    handleSaveSettings: () => Promise<void>;
    handleCancelSettings: () => void;
}

export const useSettings = (
    settings: GetSettingsResponse | null,
    updateSettings: (updates: {
        musicAssistantUrl: string;
        aiProviders: AIProviderConfig[];
        customSystemPrompt?: string;
        providerWeights?: string;
    }) => Promise<Error | undefined>,
    setError: (message: string) => void,
    closeSettings: () => void
): UseSettingsReturn => {
    const [musicAssistantUrl, setMusicAssistantUrl] = useState("");
    const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
    const [customSystemPrompt, setCustomSystemPrompt] = useState("");
    const [providerWeights, setProviderWeights] = useState("[]");
    const [testingMA, setTestingMA] = useState(false);
    const [testResults, setTestResults] = useState<TestResults>({});

    useEffect(() => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? "");
            setProviderWeights(settings.providerWeights);
        }
    }, [settings]);

    const testMA = async (): Promise<void> => {
        setTestingMA(true);
        setTestResults({ ...testResults, ma: undefined });

        const result = await testMusicAssistantConnection(musicAssistantUrl);
        setTestResults({ ...testResults, ma: result });

        setTestingMA(false);
    };

    const handleSaveSettings = useCallback(async (): Promise<void> => {
        if (musicAssistantUrl.trim().length === 0) {
            setError("Music Assistant URL is required");
            return;
        }

        if (aiProviders.length === 0) {
            setError("At least one AI provider is required");
            return;
        }

        const err = await updateSettings({
            musicAssistantUrl,
            aiProviders,
            customSystemPrompt:
                customSystemPrompt.trim().length > 0 ? customSystemPrompt : undefined,
            providerWeights
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
        providerWeights,
        updateSettings,
        setError,
        closeSettings
    ]);

    const handleCancelSettings = useCallback((): void => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? "");
            setProviderWeights(settings.providerWeights);
        }
        closeSettings();
    }, [settings, closeSettings]);

    return {
        musicAssistantUrl,
        setMusicAssistantUrl,
        aiProviders,
        setAiProviders,
        customSystemPrompt,
        setCustomSystemPrompt,
        providerWeights,
        setProviderWeights,
        testingMA,
        testResults,
        testMA,
        handleSaveSettings,
        handleCancelSettings
    };
};
