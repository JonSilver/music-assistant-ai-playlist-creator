import { SUCCESS_MESSAGES } from "@shared/constants";
import React, { useState } from "react";
import type { AIProviderConfig } from "../../../shared/types";
import { parseProviderKeywords } from "../utils/parseProviderKeywords";
import { DefaultSystemPromptModal } from "./DefaultSystemPromptModal";
import { LoadingButton } from "./LoadingButton";
import { ProvidersManager } from "./ProvidersManager";
import { ProviderWeightsList } from "./ProviderWeightsList";
import { SettingsHeader } from "./SettingsHeader";
import { VersionCopyrightFooter } from "./VersionCopyrightFooter";

interface ISettingsPageProps {
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

export const SettingsPage: React.FC<ISettingsPageProps> = ({
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
}) => {
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
                        <SettingsHeader />

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
                                <LoadingButton
                                    className="btn btn-primary test-btn"
                                    loading={testingMA}
                                    onClick={() => {
                                        void testMA();
                                    }}
                                    disabled={musicAssistantUrl.trim().length === 0}
                                    loadingText="Testing..."
                                >
                                    Test Connection
                                </LoadingButton>
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
