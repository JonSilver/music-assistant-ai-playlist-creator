import type { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { attemptPromise } from "@jfdi/attempt";
import { API_ENDPOINTS } from "../../../shared/constants/index.js";
import { validateRequest } from "../middleware/validation.js";
import {
    LoadModelsRequestSchema,
    type LoadModelsRequest,
    type LoadModelsResponse,
    type ModelOption
} from "../../../shared/types.js";

export const setupProvidersRoutes = (router: Router): void => {
    router.post(
        API_ENDPOINTS.PROVIDERS_MODELS,
        validateRequest(LoadModelsRequestSchema),
        async (req: Request, res: Response): Promise<void> => {
            const { providerType, apiKey, baseUrl } = req.body as LoadModelsRequest;

            if (providerType === "anthropic") {
                const [err, models] = await attemptPromise(async () => {
                    const client = new Anthropic({ apiKey: apiKey ?? "" });
                    const response = await client.models.list();
                    return response.data.map(
                        (model): ModelOption => ({
                            value: model.id,
                            label: model.display_name
                        })
                    );
                });

                if (err !== undefined) {
                    res.status(500).json({ error: `Failed to load models: ${err.message}` });
                    return;
                }

                const response: LoadModelsResponse = { models };
                res.json(response);
            } else {
                const [err, models] = await attemptPromise(async () => {
                    const client = new OpenAI({
                        apiKey: apiKey ?? "not-required",
                        baseURL: baseUrl !== undefined && baseUrl.trim() !== "" ? baseUrl : undefined
                    });
                    const response = await client.models.list();
                    return response.data.map(
                        (model): ModelOption => ({
                            value: model.id,
                            label: model.id
                        })
                    );
                });

                if (err !== undefined) {
                    res.status(500).json({ error: `Failed to load models: ${err.message}` });
                    return;
                }

                const response: LoadModelsResponse = { models };
                res.json(response);
            }
        }
    );
};
