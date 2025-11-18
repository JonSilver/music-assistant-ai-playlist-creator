import type { Router, Request, Response } from "express";
import type { PlaylistDatabase } from "../db/schema.js";
import {
    type GetSettingsResponse,
    type SuccessResponse,
    UpdateSettingsRequestSchema,
    settingsUtils,
    type SettingKey
} from "../../../shared/settings-schema.js";
import { API_ENDPOINTS, ERROR_MESSAGES } from "../../../shared/constants/index.js";

export const setupSettingsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // Get settings - iterate through schema instead of hardcoding
    router.get(API_ENDPOINTS.SETTINGS, (_req: Request, res: Response) => {
        const settings: Record<string, unknown> = {};

        // Iterate through all setting fields defined in schema
        for (const key of settingsUtils.getAllKeys()) {
            const dbValue = db.getSetting(key);
            const deserialisedValue = settingsUtils.deserialiseFromDB(key, dbValue);
            settings[key] = deserialisedValue ?? settingsUtils.getDefaultValue(key);
        }

        const response: GetSettingsResponse = settings as GetSettingsResponse;

        res.json(response);
    });

    // Update settings - iterate through schema instead of hardcoding
    router.put(API_ENDPOINTS.SETTINGS, (req: Request, res: Response) => {
        // Validate request body
        const parseResult = UpdateSettingsRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: ERROR_MESSAGES.INVALID_SETTINGS,
                details: parseResult.error.message
            });
            return;
        }

        const updates = parseResult.data;

        // Iterate through all provided updates
        for (const key of Object.keys(updates) as SettingKey[]) {
            const value = updates[key];
            if (value !== undefined) {
                const serialisedValue = settingsUtils.serialiseForDB(key, value as never);
                db.setSetting(key, serialisedValue);
            }
        }

        const response: SuccessResponse = { success: true };
        res.json(response);
    });
};
