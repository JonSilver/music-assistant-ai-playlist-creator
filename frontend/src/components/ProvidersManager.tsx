import React, { useState } from "react";
import type { AIProviderConfig } from "../../../shared/types";
import { ProviderForm } from "./ProviderForm";

interface IProvidersManagerProps {
    providers: AIProviderConfig[];
    onChange: (providers: AIProviderConfig[]) => void;
}

export const ProvidersManager: React.FC<IProvidersManagerProps> = ({ providers, onChange }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AIProviderConfig>>({});

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
    };

    const handleSave = (newProvider: AIProviderConfig): void => {
        if (editingId === "new") {
            onChange([...providers, newProvider]);
        } else {
            onChange(providers.map(p => (p.id === editingId ? newProvider : p)));
        }

        setEditingId(null);
        setEditForm({});
    };

    const deleteProvider = (id: string): void => {
        // eslint-disable-next-line no-alert
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
                            <ProviderForm
                                provider={editForm}
                                onSave={handleSave}
                                onCancel={cancelEdit}
                                saveButtonText="Save"
                                saveButtonClass="btn btn-sm btn-success"
                            />
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
                        <ProviderForm
                            provider={editForm}
                            onSave={handleSave}
                            onCancel={cancelEdit}
                            saveButtonText="Add Provider"
                            saveButtonClass="btn btn-sm btn-primary"
                        />
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
