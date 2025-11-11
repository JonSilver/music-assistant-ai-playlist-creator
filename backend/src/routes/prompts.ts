import type { Router, Request, Response } from 'express';
import type { PlaylistDatabase } from '../db/schema.js';
import type { GetPromptHistoryResponse, GetPresetPromptsResponse } from '../../../shared/types.js';

export const setupPromptsRoutes = (router: Router, db: PlaylistDatabase): void => {
    // Get prompt history
    router.get('/prompts/history', (_req: Request, res: Response) => {
        const history = db.getPromptHistory(50);
        const response: GetPromptHistoryResponse = { history };
        res.json(response);
    });

    // Get preset prompts
    router.get('/prompts/presets', (_req: Request, res: Response) => {
        const presets = db.getPresetPrompts();
        const response: GetPresetPromptsResponse = { presets };
        res.json(response);
    });
};
