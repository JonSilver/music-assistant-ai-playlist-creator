import { API_ENDPOINTS } from "@shared/constants";
import type { ProviderType, LoadModelsRequest, LoadModelsResponse } from "@shared/types";
import { backendFetch } from "./fetchUtils";

export interface IModelOption {
    value: string;
    label: string;
}

export const loadModelsForProvider = async (
    providerType: ProviderType,
    apiKey: string | undefined,
    baseUrl?: string
): Promise<IModelOption[]> => {
    const request: LoadModelsRequest = {
        providerType,
        apiKey,
        baseUrl
    };

    const response = await backendFetch<LoadModelsResponse>(API_ENDPOINTS.PROVIDERS_MODELS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
    });

    return response.models;
};
