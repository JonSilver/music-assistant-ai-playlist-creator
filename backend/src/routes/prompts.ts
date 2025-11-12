import type { Router, Request, Response } from "express";
import type { PlaylistDatabase } from "../db/schema.js";
import type { GetPromptHistoryResponse, GetPresetPromptsResponse } from "../../../shared/types.js";
import { API_ENDPOINTS, LIMITS } from "../../../shared/constants/index.js";

export const setupPromptsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // Get prompt history
    router.get(API_ENDPOINTS.PROMPTS_HISTORY, (_req: Request, res: Response) => {
        const history = db.getPromptHistory(LIMITS.PROMPT_HISTORY);
        const response: GetPromptHistoryResponse = { history };
        res.json(response);
    });

    // Get preset prompts
    router.get(API_ENDPOINTS.PROMPTS_PRESETS, (_req: Request, res: Response) => {
        const presets = db.getPresetPrompts();
        const response: GetPresetPromptsResponse = { presets };
        res.json(response);
    });
};
