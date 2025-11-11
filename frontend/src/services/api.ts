import { attemptPromise } from '@jfdi/attempt';
import type {
    GetSettingsResponse,
    UpdateSettingsRequest,
    PromptHistory,
    PresetPrompt
} from '@shared/types';

const backendPort = (import.meta.env.VITE_BACKEND_PORT as string | undefined) ?? '3333';
const API_BASE =
    (import.meta.env.VITE_API_URL as string | undefined) ?? `http://localhost:${backendPort}/api`;

interface ErrorResponse {
    error?: string;
    details?: string;
}

const fetchJSON = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> | undefined)
        }
    });

    if (!response.ok) {
        const [err, errorBody] = await attemptPromise<ErrorResponse>(
            async () => (await response.json()) as ErrorResponse
        );
        const message =
            err === undefined && errorBody.error !== undefined
                ? (errorBody.details ?? errorBody.error)
                : response.statusText;
        throw new Error(message);
    }

    return (await response.json()) as T;
};

export const api = {
    // Settings
    getSettings: async () =>
        attemptPromise<GetSettingsResponse>(async () => fetchJSON('/settings')),

    updateSettings: async (updates: UpdateSettingsRequest) =>
        attemptPromise<{ success: boolean }>(async () =>
            fetchJSON('/settings', {
                method: 'PUT',
                body: JSON.stringify(updates)
            })
        ),

    // Prompts
    getPromptHistory: async () =>
        attemptPromise<{ history: PromptHistory[] }>(async () => fetchJSON('/prompts/history')),

    getPresetPrompts: async () =>
        attemptPromise<{ presets: PresetPrompt[] }>(async () => fetchJSON('/prompts/presets'))
};
