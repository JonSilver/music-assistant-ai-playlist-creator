import Anthropic from "@anthropic-ai/sdk";
import { attemptPromise } from "@jfdi/attempt";
import OpenAI from "openai";
import type { ProviderType } from "../../../shared/types";

export interface IModelOption {
    value: string;
    label: string;
}

export const loadModelsForProvider = async (
    providerType: ProviderType,
    apiKey: string,
    baseUrl?: string
): Promise<IModelOption[]> => {
    if (providerType === "anthropic") {
        const [err, models] = await attemptPromise(async () => {
            const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
            const response = await client.models.list();
            return response.data.map(model => ({
                value: model.id,
                label: model.display_name
            }));
        });

        if (err !== undefined) {
            throw new Error(`Failed to load models: ${err.message}`);
        }

        return models;
    } else {
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

        if (err !== undefined) {
            throw new Error(`Failed to load models: ${err.message}`);
        }

        return models;
    }
};
