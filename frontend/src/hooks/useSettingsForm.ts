import { useState, useEffect, useCallback } from 'react';
import { attemptPromise } from '@jfdi/attempt';
import { useAlerts } from './useAlerts';
import { MusicAssistantClient } from '../services/musicAssistant';
import { generatePlaylist as generatePlaylistAI } from '../services/ai';
import { settingsUtils, type AppSettings, type SettingKey } from '../../../shared/settings-schema';

interface TestResult {
    success: boolean;
    error?: string;
}

// Build state type from schema - temperature stored as string for form control
// aiProvider cannot be empty string, it must always have a value
type SettingsFormState = {
    [K in SettingKey]: K extends 'temperature'
        ? string
        : K extends 'aiProvider'
          ? NonNullable<ReturnType<typeof settingsUtils.getDefaultValue<K>>>
          : NonNullable<ReturnType<typeof settingsUtils.getDefaultValue<K>>> | '';
};

// Build return type from schema with getters, setters, and test methods
type UseSettingsFormReturn = {
    [K in SettingKey as K]: SettingsFormState[K];
} & {
    [K in SettingKey as `set${Capitalize<K>}`]: (value: SettingsFormState[K]) => void;
} & {
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
};

const capitalize = <S extends string>(s: S): Capitalize<S> =>
    (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;

const buildInitialState = (): SettingsFormState => {
    const state: Partial<SettingsFormState> = {};
    settingsUtils.getAllKeys().forEach(key => {
        const defaultValue = settingsUtils.getDefaultValue(key);

        // Special handling for enum and number types based on form state requirements
        if (key === 'aiProvider') {
            state[key] = (defaultValue ?? 'claude') as SettingsFormState[typeof key];
        } else if (key === 'temperature') {
            state[key] = (defaultValue !== undefined ? String(defaultValue) : '1.0') as SettingsFormState[typeof key];
        } else {
            state[key] = (defaultValue ?? '') as SettingsFormState[typeof key];
        }
    });
    return state as SettingsFormState;
};

const buildStateFromSettings = (settings: AppSettings): SettingsFormState => {
    const state: Partial<SettingsFormState> = {};
    settingsUtils.getAllKeys().forEach(key => {
        const apiValue = settings[key];
        const defaultValue = settingsUtils.getDefaultValue(key);

        // Special handling for enum and number types based on form state requirements
        if (key === 'aiProvider') {
            state[key] = (apiValue ?? defaultValue ?? 'claude') as SettingsFormState[typeof key];
        } else if (key === 'temperature') {
            state[key] = (apiValue !== undefined ? String(apiValue) : '1.0') as SettingsFormState[typeof key];
        } else {
            state[key] = (apiValue ?? defaultValue ?? '') as SettingsFormState[typeof key];
        }
    });
    return state as SettingsFormState;
};

export const useSettingsForm = (settings: AppSettings | null): UseSettingsFormReturn => {
    const { setError } = useAlerts();

    // Generate state from schema
    const [formState, setFormState] = useState<SettingsFormState>(buildInitialState);
    const [testingMA, setTestingMA] = useState(false);
    const [testingAnthropic, setTestingAnthropic] = useState(false);
    const [testingOpenAI, setTestingOpenAI] = useState(false);
    const [testResults, setTestResults] = useState<{
        ma?: TestResult;
        anthropic?: TestResult;
        openai?: TestResult;
    }>({});

    // Sync form state when settings change
    useEffect(() => {
        if (settings !== null) {
            setFormState(buildStateFromSettings(settings));
        }
    }, [settings]);

    // Test functions
    const testMA = useCallback(async (): Promise<void> => {
        if (formState.musicAssistantUrl.trim().length === 0) {
            setError('Please enter a Music Assistant URL');
            return;
        }

        setTestingMA(true);
        setTestResults(prev => ({ ...prev, ma: undefined }));

        const [err] = await attemptPromise(async () => {
            const client = new MusicAssistantClient(formState.musicAssistantUrl.trim());
            await client.connect();
            client.disconnect();
        });

        setTestingMA(false);

        if (err !== undefined) {
            setTestResults(prev => ({ ...prev, ma: { success: false, error: err.message } }));
        } else {
            setTestResults(prev => ({ ...prev, ma: { success: true } }));
        }
    }, [formState.musicAssistantUrl, setError]);

    const testAnthropic = useCallback(async (): Promise<void> => {
        if (formState.anthropicApiKey.trim().length === 0) {
            setError('Please enter an Anthropic API key');
            return;
        }

        setTestingAnthropic(true);
        setTestResults(prev => ({ ...prev, anthropic: undefined }));

        const [err] = await attemptPromise(async () =>
            generatePlaylistAI({
                prompt: 'Test',
                provider: 'claude',
                apiKey: formState.anthropicApiKey.trim()
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
    }, [formState.anthropicApiKey, setError]);

    const testOpenAI = useCallback(async (): Promise<void> => {
        if (formState.openaiApiKey.trim().length === 0) {
            setError('Please enter an OpenAI API key');
            return;
        }

        setTestingOpenAI(true);
        setTestResults(prev => ({ ...prev, openai: undefined }));

        const [err] = await attemptPromise(async () =>
            generatePlaylistAI({
                prompt: 'Test',
                provider: 'openai',
                apiKey: formState.openaiApiKey.trim(),
                baseUrl:
                    formState.openaiBaseUrl.trim().length > 0
                        ? formState.openaiBaseUrl.trim()
                        : undefined
            })
        );

        setTestingOpenAI(false);

        if (err !== undefined) {
            setTestResults(prev => ({ ...prev, openai: { success: false, error: err.message } }));
        } else {
            setTestResults(prev => ({ ...prev, openai: { success: true } }));
        }
    }, [formState.openaiApiKey, formState.openaiBaseUrl, setError]);

    // Build return object dynamically with proper typing
    const baseResult = {
        testingMA,
        testingAnthropic,
        testingOpenAI,
        testResults,
        testMA,
        testAnthropic,
        testOpenAI
    };

    const fieldsObject = Object.fromEntries(
        settingsUtils.getAllKeys().flatMap(key => [
            [key, formState[key]],
            [
                `set${capitalize(key)}`,
                (value: SettingsFormState[typeof key]) => {
                    setFormState(prev => ({ ...prev, [key]: value }));
                }
            ]
        ])
    );

    return { ...baseResult, ...fieldsObject } as UseSettingsFormReturn;
};
