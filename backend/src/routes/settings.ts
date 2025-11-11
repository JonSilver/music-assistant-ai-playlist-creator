import type { Router, Request, Response } from 'express';
import type { PlaylistDatabase } from '../db/schema.js';
import {
    type GetSettingsResponse,
    type SuccessResponse,
    UpdateSettingsRequestSchema
} from '../../../shared/types.js';

export const setupSettingsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // Get settings
    router.get('/settings', (_req: Request, res: Response) => {
        const musicAssistantUrl = db.getSetting('musicAssistantUrl') ?? '';
        const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai';
        const anthropicKey = db.getSetting('anthropicApiKey');
        const anthropicModel = db.getSetting('anthropicModel');
        const openaiKey = db.getSetting('openaiApiKey');
        const openaiModel = db.getSetting('openaiModel');
        const openaiBaseUrl = db.getSetting('openaiBaseUrl');
        const customSystemPrompt = db.getSetting('customSystemPrompt');
        const temperatureStr = db.getSetting('temperature');
        const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined;

        const response: GetSettingsResponse = {
            musicAssistantUrl,
            aiProvider,
            anthropicApiKey: anthropicKey ?? undefined,
            anthropicModel: anthropicModel ?? undefined,
            openaiApiKey: openaiKey ?? undefined,
            openaiModel: openaiModel ?? undefined,
            openaiBaseUrl: openaiBaseUrl ?? undefined,
            customSystemPrompt: customSystemPrompt ?? undefined,
            temperature,
            hasAnthropicKey: Boolean(anthropicKey),
            hasOpenAIKey: Boolean(openaiKey)
        };

        res.json(response);
    });

    // Update settings
    router.put('/settings', (req: Request, res: Response) => {
        // Validate request body
        const parseResult = UpdateSettingsRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: 'Invalid request',
                details: parseResult.error.message
            });
            return;
        }

        const updates = parseResult.data;

        if (updates.musicAssistantUrl !== undefined) {
            db.setSetting('musicAssistantUrl', updates.musicAssistantUrl);
        }

        if (updates.aiProvider !== undefined) {
            db.setSetting('aiProvider', updates.aiProvider);
        }

        if (updates.anthropicApiKey !== undefined) {
            db.setSetting('anthropicApiKey', updates.anthropicApiKey);
        }

        if (updates.anthropicModel !== undefined) {
            db.setSetting('anthropicModel', updates.anthropicModel);
        }

        if (updates.openaiApiKey !== undefined) {
            db.setSetting('openaiApiKey', updates.openaiApiKey);
        }

        if (updates.openaiModel !== undefined) {
            db.setSetting('openaiModel', updates.openaiModel);
        }

        if (updates.openaiBaseUrl !== undefined) {
            db.setSetting('openaiBaseUrl', updates.openaiBaseUrl);
        }

        if (updates.customSystemPrompt !== undefined) {
            db.setSetting('customSystemPrompt', updates.customSystemPrompt);
        }

        if (updates.temperature !== undefined) {
            db.setSetting('temperature', updates.temperature.toString());
        }

        const response: SuccessResponse = { success: true };
        res.json(response);
    });
};
