import React from "react";
import type {
    MusicApiBlendConfig,
    MusicApiProviderConfig,
    MusicApiProviderType,
    BlendMode
} from "@shared/types";
import { BLEND_MODES, MUSIC_API_PROVIDERS } from "@shared/types";

interface IMusicApisSettingsProps {
    config: MusicApiBlendConfig;
    onConfigChange: (config: MusicApiBlendConfig) => void;
}

const API_DISPLAY: Record<MusicApiProviderType, { name: string; requiresKey: boolean; keyLabel: string; helpUrl?: string; helpText: string }> = {
    lastfm: {
        name: "Last.fm",
        requiresKey: true,
        keyLabel: "API Key",
        helpUrl: "https://www.last.fm/api/account/create",
        helpText: "Get a free API key"
    },
    musicbrainz: {
        name: "MusicBrainz",
        requiresKey: false,
        keyLabel: "",
        helpText: "No API key required. Uses the open MusicBrainz database."
    }
};

const BLEND_MODE_DISPLAY: Record<BlendMode, { label: string; description: string }> = {
    supplement: {
        label: "Supplement",
        description: "Add API tracks alongside AI suggestions"
    },
    enrich: {
        label: "Enrich",
        description: "Use APIs to validate and enhance AI picks"
    },
    replace: {
        label: "Replace",
        description: "Use APIs as the primary track source"
    }
};

const getProviderConfig = (
    providers: MusicApiProviderConfig[],
    type: MusicApiProviderType
): MusicApiProviderConfig =>
    providers.find(p => p.type === type) ?? { type, enabled: false };

export const MusicApisSettings: React.FC<IMusicApisSettingsProps> = ({
    config,
    onConfigChange
}) => {
    const updateProvider = (type: MusicApiProviderType, updates: Partial<MusicApiProviderConfig>): void => {
        const existing = config.providers.find(p => p.type === type);
        const updated: MusicApiProviderConfig = {
            type,
            enabled: false,
            ...existing,
            ...updates
        };
        const newProviders = config.providers.some(p => p.type === type)
            ? config.providers.map(p => (p.type === type ? updated : p))
            : [...config.providers, updated];
        const anyEnabled = newProviders.some(p => p.enabled);
        onConfigChange({ ...config, providers: newProviders, enabled: anyEnabled });
    };

    const hasAnyEnabled = config.providers.some(p => p.enabled);

    return (
        <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" defaultChecked={hasAnyEnabled} />
            <div className="collapse-title font-semibold">
                Music Discovery APIs (Optional)
            </div>
            <div className="collapse-content">
                <p className="text-sm opacity-60 mb-4">
                    Supplement AI suggestions with real-world music data.
                    No APIs are required — the AI works great on its own.
                </p>

                <div className="space-y-3">
                    {MUSIC_API_PROVIDERS.map(apiType => {
                        const display = API_DISPLAY[apiType];
                        const providerConfig = getProviderConfig(config.providers, apiType);

                        return (
                            <div key={apiType} className="card bg-base-100 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={providerConfig.enabled}
                                        onChange={e => {
                                            updateProvider(apiType, { enabled: e.target.checked });
                                        }}
                                    />
                                    <span className="font-medium">{display.name}</span>
                                </div>

                                {display.requiresKey ? (
                                    <div className="ml-9">
                                        <input
                                            type="password"
                                            placeholder={display.keyLabel}
                                            className="input input-bordered input-sm w-full"
                                            value={providerConfig.apiKey ?? ""}
                                            onChange={e => {
                                                updateProvider(apiType, { apiKey: e.target.value });
                                            }}
                                            disabled={!providerConfig.enabled}
                                        />
                                        <label className="label">
                                            <span className="label-text-alt">
                                                {display.helpUrl !== undefined ? (
                                                    <a href={display.helpUrl} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                        {display.helpText}
                                                    </a>
                                                ) : display.helpText}
                                            </span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="ml-9">
                                        <span className="text-sm opacity-60 italic">
                                            {display.helpText}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="form-control mt-4">
                    <label className="label">
                        <span className="label-text">Blend Mode</span>
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {BLEND_MODES.map(mode => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="blendMode"
                                    className="radio radio-primary radio-sm"
                                    checked={config.blendMode === mode}
                                    onChange={() => {
                                        onConfigChange({ ...config, blendMode: mode });
                                    }}
                                />
                                <span className="text-sm">{BLEND_MODE_DISPLAY[mode].label}</span>
                            </label>
                        ))}
                    </div>
                    <label className="label">
                        <span className="label-text-alt">
                            {BLEND_MODE_DISPLAY[config.blendMode].description}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};
