import type { AIProviderConfig } from "../../../shared/types.js";
import type { settingsUtils } from "../../../shared/settings-schema.js";

type SettingsReturn = ReturnType<typeof settingsUtils.getSettings>;

export const selectProvider = (
    settings: SettingsReturn,
    providerPreference?: string
): AIProviderConfig => {
    if (providerPreference !== undefined) {
        const preferredProvider = settings.providers.find(
            (p: AIProviderConfig) => p.id === providerPreference
        );
        if (preferredProvider !== undefined) 
            return preferredProvider;
        
    }
    return settings.defaultProvider;
};
