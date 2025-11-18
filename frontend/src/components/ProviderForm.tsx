import { attemptPromise } from "@jfdi/attempt";
import React, { useState } from "react";
import type { AIProviderConfig, ProviderType } from "../../../shared/types";
import { loadModelsForProvider, type IModelOption } from "../utils/modelLoader";
import { SearchableSelect } from "./SearchableSelect";

interface IProviderFormProps {
    provider: Partial<AIProviderConfig>;
    onSave: (provider: AIProviderConfig) => void;
    onCancel: () => void;
    saveButtonText: string;
    saveButtonClass: string;
}

export const ProviderForm: React.FC<IProviderFormProps> = ({
    provider: initialProvider,
    onSave,
    onCancel,
    saveButtonText,
    saveButtonClass
}) => {
    const [provider, setProvider] = useState<Partial<AIProviderConfig>>(initialProvider);
    const [availableModels, setAvailableModels] = useState<IModelOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const handleChange = (field: keyof AIProviderConfig, value: string | number): void => {
        setProvider(prev => ({ ...prev, [field]: value }));
    };

    const loadModels = async (): Promise<void> => {
        if (provider.apiKey === undefined || provider.apiKey.trim() === "") {
            setModelsError("Please enter an API key first");
            return;
        }

        if (provider.type === undefined) {
            setModelsError("Please select a provider type first");
            return;
        }

        const apiKey = provider.apiKey;
        const providerType = provider.type;

        setLoadingModels(true);
        setModelsError(null);

        const [err, models] = await attemptPromise(async () =>
            loadModelsForProvider(providerType, apiKey, provider.baseUrl)
        );

        setLoadingModels(false);

        if (err !== undefined) {
            setModelsError(err.message);
            return;
        }

        setAvailableModels(models);
        setShowModelDropdown(true);
    };

    const handleSave = (): void => {
        if (
            provider.id === undefined ||
            provider.name === undefined ||
            provider.name.trim() === "" ||
            provider.type === undefined ||
            provider.apiKey === undefined ||
            provider.apiKey.trim() === "" ||
            provider.model === undefined ||
            provider.model.trim() === ""
        ) {
            // eslint-disable-next-line no-alert
            alert("Please fill in all required fields");
            return;
        }

        const validatedProvider: AIProviderConfig = {
            id: provider.id,
            name: provider.name,
            type: provider.type,
            apiKey: provider.apiKey,
            model: provider.model,
            baseUrl: provider.baseUrl,
            temperature: provider.temperature
        };

        onSave(validatedProvider);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        handleChange("name", e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        handleChange("type", e.target.value as ProviderType);
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        handleChange("apiKey", e.target.value);
    };

    const handleModelTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        handleChange("model", e.target.value);
    };

    const handleModelSelectChange = (model: string): void => {
        handleChange("model", model);
    };

    const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        handleChange("baseUrl", e.target.value);
    };

    const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        handleChange("temperature", parseFloat(e.target.value));
    };

    const handleLoadModels = (): void => {
        void loadModels();
    };

    return (
        <div className="space-y-3">
            <input
                type="text"
                placeholder="Provider Name (e.g., Claude 3.5)"
                className="input input-bordered input-sm w-full"
                value={provider.name ?? ""}
                onChange={handleNameChange}
            />
            <select
                className="select select-bordered select-sm w-full"
                value={provider.type ?? "anthropic"}
                onChange={handleTypeChange}
            >
                <option value="anthropic">Anthropic</option>
                <option value="openai-compatible">OpenAI-Compatible</option>
            </select>
            <input
                type="password"
                placeholder="API Key"
                className="input input-bordered input-sm w-full"
                value={provider.apiKey ?? ""}
                onChange={handleApiKeyChange}
            />
            <div className="space-y-2">
                <div className="flex gap-2">
                    {showModelDropdown && availableModels.length > 0 ? (
                        <div className="flex-1">
                            <SearchableSelect
                                options={availableModels}
                                value={provider.model ?? ""}
                                onChange={handleModelSelectChange}
                                placeholder="Select a model..."
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Click 'Load Models' to fetch available models"
                            className="input input-bordered input-sm flex-1"
                            value={provider.model ?? ""}
                            onChange={handleModelTextChange}
                        />
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={handleLoadModels}
                        disabled={loadingModels}
                    >
                        {loadingModels ? "Loading..." : "Load Models"}
                    </button>
                </div>
                {modelsError !== null && <div className="text-error text-xs">{modelsError}</div>}
            </div>
            {(provider.type === "openai-compatible" || provider.baseUrl !== undefined) && (
                <input
                    type="text"
                    placeholder="Base URL (optional, e.g., http://localhost:11434/v1)"
                    className="input input-bordered input-sm w-full"
                    value={provider.baseUrl ?? ""}
                    onChange={handleBaseUrlChange}
                />
            )}
            <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                placeholder="Temperature (0-2)"
                className="input input-bordered input-sm w-full"
                value={provider.temperature ?? 1.0}
                onChange={handleTemperatureChange}
            />
            <div className="flex gap-2">
                <button className={`${saveButtonClass} flex-1`} onClick={handleSave}>
                    {saveButtonText}
                </button>
                <button className="btn btn-sm btn-ghost flex-1" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
};
