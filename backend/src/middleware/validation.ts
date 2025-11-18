import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

export const validateRequest =
    <T>(schema: z.ZodType<T>) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const parseResult = schema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }

        req.body = parseResult.data;
        next();
    };
