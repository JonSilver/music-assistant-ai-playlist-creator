import React, { useState } from "react";
import type { AIProviderConfig, ProviderType } from "../../../shared/types";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { attemptPromise } from "@jfdi/attempt";

interface ProvidersManagerProps {
    providers: AIProviderConfig[];
    onChange: (providers: AIProviderConfig[]) => void;
}

interface ModelOption {
    value: string;
    label: string;
}

export const ProvidersManager = ({
    providers,
    onChange
}: ProvidersManagerProps): React.JSX.Element => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AIProviderConfig>>({});
    const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const startAdd = (): void => {
        setEditingId("new");
        setEditForm({
            id: crypto.randomUUID(),
            name: "",
            type: "anthropic",
            apiKey: "",
            model: "",
            temperature: 1.0
        });
    };

    const startEdit = (provider: AIProviderConfig): void => {
        setEditingId(provider.id);
        setEditForm({ ...provider });
    };

    const cancelEdit = (): void => {
        setEditingId(null);
        setEditForm({});
        setAvailableModels([]);
        setModelsError(null);
        setShowModelDropdown(false);
    };

    const loadModels = async (): Promise<void> => {
        if (editForm.apiKey === undefined || editForm.apiKey.trim() === "") {
            setModelsError("Please enter an API key first");
            return;
        }

        if (editForm.type === undefined) {
            setModelsError("Please select a provider type first");
            return;
        }

        const apiKey = editForm.apiKey;
        const providerType = editForm.type;

        setLoadingModels(true);
        setModelsError(null);

        if (providerType === "anthropic") {
            const [err, models] = await attemptPromise(async () => {
                const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
                const response = await client.models.list();
                return response.data.map(model => ({
                    value: model.id,
                    label: model.display_name ?? model.id
                }));
            });

            setLoadingModels(false);

            if (err !== undefined) {
                setModelsError(`Failed to load models: ${err.message}`);
                return;
            }

            setAvailableModels(models);
            setShowModelDropdown(true);
        } else {
            const baseUrl = editForm.baseUrl;
            const [err, models] = await attemptPromise(async () => {
                const client = new OpenAI({
                    apiKey,
                    baseURL: baseUrl !== undefined && baseUrl.trim() !== "" ? baseUrl : undefined,
                    dangerouslyAllowBrowser: true
                });
                const response = await client.models.list();
                return response.data.map(model => ({
                    value: model.id,
                    label: model.id
                }));
            });

            setLoadingModels(false);

            if (err !== undefined) {
                setModelsError(`Failed to load models: ${err.message}`);
                return;
            }

            setAvailableModels(models);
            setShowModelDropdown(true);
        }
    };

    const saveProvider = (): void => {
        if (
            editForm.id === undefined ||
            editForm.name === undefined ||
            editForm.name.trim() === "" ||
            editForm.type === undefined ||
            editForm.apiKey === undefined ||
            editForm.apiKey.trim() === "" ||
            editForm.model === undefined ||
            editForm.model.trim() === ""
        ) {
            alert("Please fill in all required fields");
            return;
        }

        const newProvider: AIProviderConfig = {
            id: editForm.id,
            name: editForm.name,
            type: editForm.type,
            apiKey: editForm.apiKey,
            model: editForm.model,
            baseUrl: editForm.baseUrl,
            temperature: editForm.temperature
        };

        if (editingId === "new") {
            onChange([...providers, newProvider]);
        } else {
            onChange(providers.map(p => (p.id === editingId ? newProvider : p)));
        }

        setEditingId(null);
        setEditForm({});
    };

    const deleteProvider = (id: string): void => {
        if (confirm("Are you sure you want to delete this provider?")) {
            onChange(providers.filter(p => p.id !== id));
        }
    };

    return (
        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text font-semibold">AI Providers</span>
                <button className="btn btn-sm btn-primary" onClick={startAdd}>
                    + Add Provider
                </button>
            </label>

            <div className="space-y-2">
                {providers.map(provider => (
                    <div key={provider.id} className="card bg-base-200 p-4">
                        {editingId === provider.id ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Provider Name (e.g., Claude 3.5)"
                                    className="input input-bordered input-sm w-full"
                                    value={editForm.name ?? ""}
                                    onChange={e => {
                                        setEditForm({ ...editForm, name: e.target.value });
                                    }}
                                />
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={editForm.type ?? "anthropic"}
                                    onChange={e => {
                                        setEditForm({
                                            ...editForm,
                                            type: e.target.value as ProviderType
                                        });
                                    }}
                                >
                                    <option value="anthropic">Anthropic</option>
                                    <option value="openai-compatible">OpenAI-Compatible</option>
                                </select>
                                <input
                                    type="password"
                                    placeholder="API Key"
                                    className="input input-bordered input-sm w-full"
                                    value={editForm.apiKey ?? ""}
                                    onChange={e => {
                                        setEditForm({ ...editForm, apiKey: e.target.value });
                                    }}
                                />
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        {showModelDropdown && availableModels.length > 0 ? (
                                            <select
                                                className="select select-bordered select-sm flex-1"
                                                value={editForm.model ?? ""}
                                                onChange={e => {
                                                    setEditForm({
                                                        ...editForm,
                                                        model: e.target.value
                                                    });
                                                }}
                                            >
                                                <option value="">Select a model</option>
                                                {availableModels.map(model => (
                                                    <option key={model.value} value={model.value}>
                                                        {model.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Model (e.g., claude-sonnet-4-5-20250929, llama3:latest)"
                                                className="input input-bordered input-sm flex-1"
                                                value={editForm.model ?? ""}
                                                onChange={e => {
                                                    setEditForm({
                                                        ...editForm,
                                                        model: e.target.value
                                                    });
                                                }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => {
                                                void loadModels();
                                            }}
                                            disabled={loadingModels}
                                        >
                                            {loadingModels ? "Loading..." : "Load Models"}
                                        </button>
                                    </div>
                                    {modelsError !== null && (
                                        <div className="text-error text-xs">{modelsError}</div>
                                    )}
                                </div>
                                {(editForm.type === "openai-compatible" ||
                                    editForm.baseUrl !== undefined) && (
                                    <input
                                        type="text"
                                        placeholder="Base URL (optional, e.g., http://localhost:11434/v1)"
                                        className="input input-bordered input-sm w-full"
                                        value={editForm.baseUrl ?? ""}
                                        onChange={e => {
                                            setEditForm({ ...editForm, baseUrl: e.target.value });
                                        }}
                                    />
                                )}
                                <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    placeholder="Temperature (0-2)"
                                    className="input input-bordered input-sm w-full"
                                    value={editForm.temperature ?? 1.0}
                                    onChange={e => {
                                        setEditForm({
                                            ...editForm,
                                            temperature: parseFloat(e.target.value)
                                        });
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-success flex-1"
                                        onClick={saveProvider}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost flex-1"
                                        onClick={cancelEdit}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{provider.name}</div>
                                    <div className="text-sm opacity-70">
                                        {provider.type === "anthropic"
                                            ? "Anthropic"
                                            : "OpenAI-Compatible"}{" "}
                                        • {provider.model}
                                        {provider.baseUrl !== undefined && ` • ${provider.baseUrl}`}
                                        {provider.temperature !== undefined &&
                                            ` • T: ${provider.temperature}`}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            startEdit(provider);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost btn-error"
                                        onClick={() => {
                                            deleteProvider(provider.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {editingId === "new" && (
                    <div className="card bg-base-200 p-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Provider Name (e.g., Local Ollama)"
                                className="input input-bordered input-sm w-full"
                                value={editForm.name ?? ""}
                                onChange={e => {
                                    setEditForm({ ...editForm, name: e.target.value });
                                }}
                            />
                            <select
                                className="select select-bordered select-sm w-full"
                                value={editForm.type ?? "anthropic"}
                                onChange={e => {
                                    setEditForm({
                                        ...editForm,
                                        type: e.target.value as ProviderType
                                    });
                                }}
                            >
                                <option value="anthropic">Anthropic</option>
                                <option value="openai-compatible">OpenAI-Compatible</option>
                            </select>
                            <input
                                type="password"
                                placeholder="API Key"
                                className="input input-bordered input-sm w-full"
                                value={editForm.apiKey ?? ""}
                                onChange={e => {
                                    setEditForm({ ...editForm, apiKey: e.target.value });
                                }}
                            />
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    {showModelDropdown && availableModels.length > 0 ? (
                                        <select
                                            className="select select-bordered select-sm flex-1"
                                            value={editForm.model ?? ""}
                                            onChange={e => {
                                                setEditForm({ ...editForm, model: e.target.value });
                                            }}
                                        >
                                            <option value="">Select a model</option>
                                            {availableModels.map(model => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Model (e.g., llama3:latest)"
                                            className="input input-bordered input-sm flex-1"
                                            value={editForm.model ?? ""}
                                            onChange={e => {
                                                setEditForm({ ...editForm, model: e.target.value });
                                            }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            void loadModels();
                                        }}
                                        disabled={loadingModels}
                                    >
                                        {loadingModels ? "Loading..." : "Load Models"}
                                    </button>
                                </div>
                                {modelsError !== null && (
                                    <div className="text-error text-xs">{modelsError}</div>
                                )}
                            </div>
                            {(editForm.type === "openai-compatible" ||
                                editForm.baseUrl !== undefined) && (
                                <input
                                    type="text"
                                    placeholder="Base URL (e.g., http://localhost:11434/v1)"
                                    className="input input-bordered input-sm w-full"
                                    value={editForm.baseUrl ?? ""}
                                    onChange={e => {
                                        setEditForm({ ...editForm, baseUrl: e.target.value });
                                    }}
                                />
                            )}
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                placeholder="Temperature (0-2)"
                                className="input input-bordered input-sm w-full"
                                value={editForm.temperature ?? 1.0}
                                onChange={e => {
                                    setEditForm({
                                        ...editForm,
                                        temperature: parseFloat(e.target.value)
                                    });
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm btn-primary flex-1"
                                    onClick={saveProvider}
                                >
                                    Add Provider
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost flex-1"
                                    onClick={cancelEdit}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {providers.length === 0 && editingId === null && (
                    <div className="text-center text-sm opacity-70 py-4">
                        No providers configured. Click &quot;Add Provider&quot; to get started.
                    </div>
                )}
            </div>
        </div>
    );
};
