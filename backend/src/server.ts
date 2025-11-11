import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { PlaylistDatabase } from './db/schema.js';
import { setupSettingsRoutes } from './routes/settings.js';
import { setupPromptsRoutes } from './routes/prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT ?? process.env.BACKEND_PORT ?? '3333';

// Initialize database
const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, '../../data/playlists.db');
const dbDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
mkdirSync(dbDir, { recursive: true });

const db = new PlaylistDatabase(dbPath);

// Middleware
const frontendPort = process.env.FRONTEND_PORT ?? '5555';
app.use(
    cors({
        origin: process.env.FRONTEND_URL ?? `http://localhost:${frontendPort}`
    })
);
app.use(express.json({ limit: '10mb' })); // Increase payload limit for large playlists

// API router
const apiRouter = express.Router();

// Setup routes
setupSettingsRoutes(apiRouter, db);
setupPromptsRoutes(apiRouter, db);

// Health check
apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API router
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing database...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing database...');
    db.close();
    process.exit(0);
});
