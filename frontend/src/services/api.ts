import { attemptPromise } from "@jfdi/attempt";
import type {
    GetSettingsResponse,
    UpdateSettingsRequest,
    PromptHistory,
    PresetPrompt
} from "@shared/types";
import { API_BASE_PATH, DEFAULT_BACKEND_PORT, API_ENDPOINTS } from "@shared/constants";

// In production (Docker), backend serves frontend on same origin, so use relative path
// In development, frontend (5555) and backend (3333) are separate, so use absolute URL
const isDev = import.meta.env.DEV;
const API_BASE = isDev
    ? `http://localhost:${import.meta.env.VITE_BACKEND_PORT ?? DEFAULT_BACKEND_PORT}${API_BASE_PATH}`
    : API_BASE_PATH;

interface ErrorResponse {
    error?: string;
    details?: string;
}

const fetchJSON = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
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
        attemptPromise<GetSettingsResponse>(async () => fetchJSON(API_ENDPOINTS.SETTINGS)),

    updateSettings: async (updates: UpdateSettingsRequest) =>
        attemptPromise<{ success: boolean }>(async () =>
            fetchJSON(API_ENDPOINTS.SETTINGS, {
                method: "PUT",
                body: JSON.stringify(updates)
            })
        ),

    // Prompts
    getPromptHistory: async () =>
        attemptPromise<{ history: PromptHistory[] }>(async () => fetchJSON(API_ENDPOINTS.PROMPTS_HISTORY)),

    getPresetPrompts: async () =>
        attemptPromise<{ presets: PresetPrompt[] }>(async () => fetchJSON(API_ENDPOINTS.PROMPTS_PRESETS))
};
