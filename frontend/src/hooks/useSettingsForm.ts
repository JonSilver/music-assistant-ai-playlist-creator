import { useState, useEffect, useCallback } from 'react';
import { attemptPromise } from '@jfdi/attempt';
import { useAlerts } from './useAlerts';
import { MusicAssistantClient } from '../services/musicAssistant';
import { generatePlaylist as generatePlaylistAI } from '../services/ai';
import type { AppSettings } from '../../../shared/types';

interface TestResult {
    success: boolean;
    error?: string;
}

interface UseSettingsFormReturn {
    musicAssistantUrl: string;
    setMusicAssistantUrl: (value: string) => void;
    aiProvider: 'claude' | 'openai';
    setAiProvider: (value: 'claude' | 'openai') => void;
    anthropicApiKey: string;
    setAnthropicApiKey: (value: string) => void;
    anthropicModel: string;
    setAnthropicModel: (value: string) => void;
    openaiApiKey: string;
    setOpenaiApiKey: (value: string) => void;
    openaiModel: string;
    setOpenaiModel: (value: string) => void;
    openaiBaseUrl: string;
    setOpenaiBaseUrl: (value: string) => void;
    customSystemPrompt: string;
    setCustomSystemPrompt: (value: string) => void;
    temperature: string;
    setTemperature: (value: string) => void;
    testingMA: boolean;
    testingAnthropic: boolean;
    testingOpenAI: boolean;
    testResults: {
        ma?: TestResult;
        anthropic?: TestResult;
        openai?: TestResult;
    };
    testMA: () => Promise<void>;
    testAnthropic: () => Promise<void>;
    testOpenAI: () => Promise<void>;
}

export const useSettingsForm = (settings: AppSettings | null): UseSettingsFormReturn => {
    const { setError } = useAlerts();
    const [musicAssistantUrl, setMusicAssistantUrl] = useState('');
    const [aiProvider, setAiProvider] = useState<'claude' | 'openai'>('claude');
    const [anthropicApiKey, setAnthropicApiKey] = useState('');
    const [anthropicModel, setAnthropicModel] = useState('claude-sonnet-4-5-20250929');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [openaiModel, setOpenaiModel] = useState('gpt-4-turbo-preview');
    const [openaiBaseUrl, setOpenaiBaseUrl] = useState('');
    const [customSystemPrompt, setCustomSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState('1.0');
    const [testingMA, setTestingMA] = useState(false);
    const [testingAnthropic, setTestingAnthropic] = useState(false);
    const [testingOpenAI, setTestingOpenAI] = useState(false);
    const [testResults, setTestResults] = useState<{
        ma?: TestResult;
        anthropic?: TestResult;
        openai?: TestResult;
    }>({});

    useEffect(() => {
        if (settings !== null) {
            setMusicAssistantUrl(settings.musicAssistantUrl);
            setAiProvider(settings.aiProvider);
            setAnthropicApiKey(settings.anthropicApiKey ?? '');
            setAnthropicModel(settings.anthropicModel ?? 'claude-sonnet-4-5-20250929');
            setOpenaiApiKey(settings.openaiApiKey ?? '');
            setOpenaiModel(settings.openaiModel ?? 'gpt-4-turbo-preview');
            setOpenaiBaseUrl(settings.openaiBaseUrl ?? '');
            setCustomSystemPrompt(settings.customSystemPrompt ?? '');
            setTemperature(settings.temperature?.toString() ?? '1.0');
        }
    }, [settings]);

    const testMA = useCallback(async (): Promise<void> => {
        if (musicAssistantUrl.trim().length === 0) {
            setError('Please enter a Music Assistant URL');
            return;
        }

        setTestingMA(true);
        setTestResults(prev => ({ ...prev, ma: undefined }));

        const [err] = await attemptPromise(async () => {
            const client = new MusicAssistantClient(musicAssistantUrl.trim());
            await client.connect();
            client.disconnect();
        });

        setTestingMA(false);

        if (err !== undefined) {
            setTestResults(prev => ({ ...prev, ma: { success: false, error: err.message } }));
        } else {
            setTestResults(prev => ({ ...prev, ma: { success: true } }));
        }
    }, [musicAssistantUrl, setError]);

    const testAnthropic = useCallback(async (): Promise<void> => {
        if (anthropicApiKey.trim().length === 0) {
            setError('Please enter an Anthropic API key');
            return;
        }

        setTestingAnthropic(true);
        setTestResults(prev => ({ ...prev, anthropic: undefined }));

        const [err] = await attemptPromise(async () =>
            generatePlaylistAI({
                prompt: 'Test',
                provider: 'claude',
                apiKey: anthropicApiKey.trim()
            })
        );

        setTestingAnthropic(false);

        if (err !== undefined) {
            setTestResults(prev => ({
                ...prev,
                anthropic: { success: false, error: err.message }
            }));
        } else {
            setTestResults(prev => ({ ...prev, anthropic: { success: true } }));
        }
    }, [anthropicApiKey, setError]);

    const testOpenAI = useCallback(async (): Promise<void> => {
        if (openaiApiKey.trim().length === 0) {
            setError('Please enter an OpenAI API key');
            return;
        }

        setTestingOpenAI(true);
        setTestResults(prev => ({ ...prev, openai: undefined }));

        const [err] = await attemptPromise(async () =>
            generatePlaylistAI({
                prompt: 'Test',
                provider: 'openai',
                apiKey: openaiApiKey.trim(),
                baseUrl: openaiBaseUrl.trim().length > 0 ? openaiBaseUrl.trim() : undefined
            })
        );

        setTestingOpenAI(false);

        if (err !== undefined) {
            setTestResults(prev => ({ ...prev, openai: { success: false, error: err.message } }));
        } else {
            setTestResults(prev => ({ ...prev, openai: { success: true } }));
        }
    }, [openaiApiKey, openaiBaseUrl, setError]);

    return {
        musicAssistantUrl,
        setMusicAssistantUrl,
        aiProvider,
        setAiProvider,
        anthropicApiKey,
        setAnthropicApiKey,
        anthropicModel,
        setAnthropicModel,
        openaiApiKey,
        setOpenaiApiKey,
        openaiModel,
        setOpenaiModel,
        openaiBaseUrl,
        setOpenaiBaseUrl,
        customSystemPrompt,
        setCustomSystemPrompt,
        temperature,
        setTemperature,
        testingMA,
        testingAnthropic,
        testingOpenAI,
        testResults,
        testMA,
        testAnthropic,
        testOpenAI
    };
};
