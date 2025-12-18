import { useState, useEffect, useCallback } from "react";
import type { AIProviderConfig, GetSettingsResponse } from "@shared/types";
import { testMusicAssistantConnection } from "../services/playlistApi";

interface TestResults {
    ma?: { success: boolean; error?: string };
}

interface UseSettingsReturn {
    musicAssistantUrl: string;
    setMusicAssistantUrl: (url: string) => void;
    musicAssistantToken: string;
    setMusicAssistantToken: (token: string) => void;
    aiProviders: AIProviderConfig[];
    setAiProviders: (providers: AIProviderConfig[]) => void;
    customSystemPrompt: string;
    setCustomSystemPrompt: (prompt: string) => void;
    providerWeights: string;
    setProviderWeights: (weights: string) => void;
    defaultProviderId: string | undefined;
    setDefaultProviderId: (id: string | undefined) => void;
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
        musicAssistantToken?: string;
        aiProviders: AIProviderConfig[];
        customSystemPrompt?: string;
        providerWeights?: string;
        defaultProviderId?: string;
    }) => Promise<Error | undefined>,
    setError: (message: string) => void,
    closeSettings: () => void
): UseSettingsReturn => {
    const [musicAssistantUrl, setMusicAssistantUrl] = useState("");
    const [musicAssistantToken, setMusicAssistantToken] = useState("");
    const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
    const [customSystemPrompt, setCustomSystemPrompt] = useState("");
    const [providerWeights, setProviderWeights] = useState("[]");
    const [defaultProviderId, setDefaultProviderId] = useState<string | undefined>(undefined);
    const [testingMA, setTestingMA] = useState(false);
    const [testResults, setTestResults] = useState<TestResults>({});

    useEffect(() => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setMusicAssistantToken(settings.musicAssistantToken ?? "");
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? "");
            setProviderWeights(settings.providerWeights);
            setDefaultProviderId(settings.defaultProviderId);
        }
    }, [settings]);

    const testMA = async (): Promise<void> => {
        setTestingMA(true);
        setTestResults({ ...testResults, ma: undefined });

        const token = musicAssistantToken.trim().length > 0 ? musicAssistantToken : undefined;
        const result = await testMusicAssistantConnection(musicAssistantUrl, token);
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
            musicAssistantToken:
                musicAssistantToken.trim().length > 0 ? musicAssistantToken : undefined,
            aiProviders,
            customSystemPrompt:
                customSystemPrompt.trim().length > 0 ? customSystemPrompt : undefined,
            providerWeights,
            defaultProviderId
        });

        if (err !== undefined) {
            setError(`Failed to save settings: ${err.message}`);
            return;
        }

        closeSettings();
    }, [
        musicAssistantUrl,
        musicAssistantToken,
        aiProviders,
        customSystemPrompt,
        providerWeights,
        defaultProviderId,
        updateSettings,
        setError,
        closeSettings
    ]);

    const handleCancelSettings = useCallback((): void => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setMusicAssistantToken(settings.musicAssistantToken ?? "");
            setAiProviders(settings.aiProviders);
            setCustomSystemPrompt(settings.customSystemPrompt ?? "");
            setProviderWeights(settings.providerWeights);
            setDefaultProviderId(settings.defaultProviderId);
        }
        closeSettings();
    }, [settings, closeSettings]);

    return {
        musicAssistantUrl,
        setMusicAssistantUrl,
        musicAssistantToken,
        setMusicAssistantToken,
        aiProviders,
        setAiProviders,
        customSystemPrompt,
        setCustomSystemPrompt,
        providerWeights,
        setProviderWeights,
        defaultProviderId,
        setDefaultProviderId,
        testingMA,
        testResults,
        testMA,
        handleSaveSettings,
        handleCancelSettings
    };
};
