import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { attemptPromise } from '@jfdi/attempt';

const router = express.Router();

interface ModelOption {
    value: string;
    label: string;
}

interface ModelsResponse {
    models: ModelOption[];
}

router.get('/anthropic', async (req, res) => {
    const apiKey = req.query.apiKey as string | undefined;

    if (apiKey === undefined || apiKey.trim() === '') {
        res.status(400).json({ error: 'API key is required' });
        return;
    }

    const [err, models] = await attemptPromise(async () => {
        const client = new Anthropic({ apiKey });
        const response = await client.models.list();
        return response.data.map(model => ({
            value: model.id,
            label: model.display_name ?? model.id
        }));
    });

    if (err !== undefined) {
        res.status(500).json({ error: `Failed to fetch models: ${err.message}` });
        return;
    }

    const response: ModelsResponse = { models };
    res.json(response);
});

router.get('/openai', async (req, res) => {
    const apiKey = req.query.apiKey as string | undefined;
    const baseUrl = req.query.baseUrl as string | undefined;

    if (apiKey === undefined || apiKey.trim() === '') {
        res.status(400).json({ error: 'API key is required' });
        return;
    }

    const [err, models] = await attemptPromise(async () => {
        const client = new OpenAI({
            apiKey,
            baseURL: baseUrl !== undefined && baseUrl.trim() !== '' ? baseUrl : undefined
        });
        const response = await client.models.list();
        return response.data.map(model => ({
            value: model.id,
            label: model.id
        }));
    });

    if (err !== undefined) {
        res.status(500).json({ error: `Failed to fetch models: ${err.message}` });
        return;
    }

    const response: ModelsResponse = { models };
    res.json(response);
});

export default router;
