import React, { useState } from "react";
import type { AIProviderConfig } from "../../../shared/types";
import { DefaultSystemPromptModal } from "./DefaultSystemPromptModal";
import { ProvidersManager } from "./ProvidersManager";
import { VersionCopyrightFooter } from "./VersionCopyrightFooter";

interface SettingsPageProps {
    musicAssistantUrl: string;
    setMusicAssistantUrl: (value: string) => void;
    aiProviders: AIProviderConfig[];
    setAiProviders: (value: AIProviderConfig[]) => void;
    customSystemPrompt: string;
    setCustomSystemPrompt: (value: string) => void;
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
    testingMA,
    testResults,
    testMA,
    onSave,
    onCancel,
    showCancel
}: SettingsPageProps): React.JSX.Element => {
    const [showDefaultPrompt, setShowDefaultPrompt] = useState(false);

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="mb-6">
                            <h1 className="card-title text-2xl mb-0">AI Playlist Creator</h1>
                            <p className="text-sm opacity-70 mt-1">for Music Assistant</p>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Music Assistant URL</span>
                            </label>
                            <input
                                type="text"
                                placeholder="http://192.168.1.100:8095"
                                className="input input-bordered w-full"
                                value={musicAssistantUrl}
                                onChange={e => {
                                    setMusicAssistantUrl(e.target.value);
                                }}
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    WebSocket URL of your Music Assistant server
                                </span>
                            </label>
                            <button
                                className="btn btn-sm btn-outline mt-2 test-btn"
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
                            {testResults.ma !== undefined && (
                                <div
                                    className={`alert ${testResults.ma.success ? "alert-success" : "alert-error"} mt-2`}
                                >
                                    {testResults.ma.success
                                        ? "Connection successful!"
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
                                    Customize how the AI curates playlists. Must return JSON format.
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
