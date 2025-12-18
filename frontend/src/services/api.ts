import { attemptPromise } from "@jfdi/attempt";
import type {
    GetSettingsResponse,
    UpdateSettingsRequest,
    PromptHistory,
    PresetPrompt
} from "@shared/types";
import { API_ENDPOINTS } from "@shared/constants";
import { backendFetch } from "../utils/fetchUtils";

export const api = {
    // Settings
    getSettings: async () =>
        attemptPromise<GetSettingsResponse>(async () => backendFetch(API_ENDPOINTS.SETTINGS)),

    updateSettings: async (updates: UpdateSettingsRequest) =>
        attemptPromise<{ success: boolean }>(async () =>
            backendFetch(API_ENDPOINTS.SETTINGS, {
                method: "PUT",
                body: JSON.stringify(updates)
            })
        ),

    // Prompts
    getPromptHistory: async () =>
        attemptPromise<{ history: PromptHistory[] }>(async () =>
            backendFetch(API_ENDPOINTS.PROMPTS_HISTORY)
        ),

    getPresetPrompts: async () =>
        attemptPromise<{ presets: PresetPrompt[] }>(async () =>
            backendFetch(API_ENDPOINTS.PROMPTS_PRESETS)
        )
};
