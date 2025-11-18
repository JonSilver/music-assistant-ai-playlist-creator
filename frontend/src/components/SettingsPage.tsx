import { SUCCESS_MESSAGES } from "@shared/constants";
import React, { useState } from "react";
import type { AIProviderConfig } from "../../../shared/types";
import { parseProviderKeywords } from "../utils/parseProviderKeywords";
import { DefaultSystemPromptModal } from "./DefaultSystemPromptModal";
import { ProvidersManager } from "./ProvidersManager";
import { ProviderWeightsList } from "./ProviderWeightsList";
import { VersionCopyrightFooter } from "./VersionCopyrightFooter";

interface SettingsPageProps {
    musicAssistantUrl: string;
    setMusicAssistantUrl: (value: string) => void;
    aiProviders: AIProviderConfig[];
    setAiProviders: (value: AIProviderConfig[]) => void;
    customSystemPrompt: string;
    setCustomSystemPrompt: (value: string) => void;
    providerWeights: string;
    setProviderWeights: (value: string) => void;
    testingMA: boolean;
    testResults: {
        ma?: { success: boolean; error?: string };
    };
    testMA: () => Promise<void>;
    onSave: () => void;
    onCancel?: () => void;
    showCancel: boolean;
}

export const SettingsPage = ({
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
    onSave,
    onCancel,
    showCancel
}: SettingsPageProps): React.JSX.Element => {
    const [showDefaultPrompt, setShowDefaultPrompt] = useState(false);

    // Handle provider keywords change
    const handleProviderKeywordsChange = (keywords: string[]): void => {
        setProviderWeights(JSON.stringify(keywords));
    };

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="mb-6 flex items-start gap-3">
                            <img src="/logo.png" alt="Logo" className="h-12" />
                            <div className="flex flex-col items-start flex-1">
                                <h1 className="card-title text-2xl mb-0">AI Playlist Creator</h1>
                                <p className="text-sm opacity-70 mt-1">for Music Assistant</p>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href="https://github.com/JonSilver/music-assistant-ai-playlist-creator"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-ghost btn-sm btn-square"
                                    title="GitHub Repository"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://hub.docker.com/r/jonsilver/music-assistant-ai-playlist-creator"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-ghost btn-sm btn-square"
                                    title="Docker Hub"
                                >
                                    <img src="/docker-icon.svg" alt="Docker" className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Music Assistant URL</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. http://192.168.1.100:8095"
                                    className="input input-bordered flex-1"
                                    value={musicAssistantUrl}
                                    onChange={e => {
                                        setMusicAssistantUrl(e.target.value);
                                    }}
                                />
                                <button
                                    className="btn btn-primary test-btn"
                                    onClick={() => {
                                        void testMA();
                                    }}
                                    disabled={testingMA || musicAssistantUrl.trim().length === 0}
                                >
                                    {testingMA && (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    )}
                                    {testingMA ? "Testing..." : "Test Connection"}
                                </button>
                            </div>
                            <label className="label">
                                <span className="label-text-alt">
                                    WebSocket URL of your Music Assistant server
                                </span>
                            </label>
                            {testResults.ma !== undefined && (
                                <div
                                    className={`alert ${testResults.ma.success ? "alert-success" : "alert-error"} mt-2`}
                                >
                                    {testResults.ma.success
                                        ? SUCCESS_MESSAGES.CONNECTION_OK
                                        : `Connection failed: ${testResults.ma.error ?? "Unknown error"}`}
                                </div>
                            )}
                        </div>

                        <div className="divider"></div>

                        <ProvidersManager providers={aiProviders} onChange={setAiProviders} />

                        <div className="divider"></div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Custom System Prompt (Optional)</span>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => {
                                        setShowDefaultPrompt(true);
                                    }}
                                >
                                    Preview Default Prompt
                                </button>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-32 w-full"
                                placeholder="Override the default AI system prompt. Leave empty to use default."
                                value={customSystemPrompt}
                                onChange={e => {
                                    setCustomSystemPrompt(e.target.value);
                                }}
                            ></textarea>
                            <label className="label">
                                <span className="label-text-alt">
                                    Customise how the AI curates playlists. Must return JSON format.
                                </span>
                            </label>
                        </div>

                        <div className="divider"></div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Provider Preferences (Optional)</span>
                            </label>
                            <ProviderWeightsList
                                keywords={parseProviderKeywords(providerWeights)}
                                onChange={handleProviderKeywordsChange}
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    Prioritise music providers when matching tracks
                                </span>
                            </label>
                        </div>

                        <div className="relative card-actions justify-end gap-2">
                            {showCancel && onCancel !== undefined && (
                                <button className="btn btn-ghost" onClick={onCancel}>
                                    Cancel
                                </button>
                            )}
                            <button className="btn btn-primary" onClick={onSave}>
                                Save Settings
                            </button>
                            <VersionCopyrightFooter />
                        </div>
                    </div>
                </div>

                <DefaultSystemPromptModal
                    show={showDefaultPrompt}
                    onClose={() => {
                        setShowDefaultPrompt(false);
                    }}
                />
            </div>
        </div>
    );
};
