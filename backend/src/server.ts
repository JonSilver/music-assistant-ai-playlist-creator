import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PlaylistDatabase } from "./db/schema.js";
import { setupPromptsRoutes } from "./routes/prompts.js";
import { setupSettingsRoutes } from "./routes/settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT ?? "9876";

// Initialize database
const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "../../data/playlists.db");
const dbDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
mkdirSync(dbDir, { recursive: true });

const db = new PlaylistDatabase(dbPath);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increase payload limit for large playlists

// 1) Static assets from: backend/dist/public
const staticDir = path.resolve(__dirname, "..", "..", "public");
app.use(express.static(staticDir));

// 2) SPA fallback for client-side routes (no "*")
app.use((req, res, next) => {
    // Let API and asset/file requests pass
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api")) return next();
    if (req.path.includes(".")) return next(); // e.g. /main.js, /logo.png

    res.sendFile(path.join(staticDir, "index.html"));
});

// API router
const apiRouter = express.Router();

// Setup routes
setupSettingsRoutes(apiRouter, db);
setupPromptsRoutes(apiRouter, db);

// Health check
apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount API router
app.use("/api", apiRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing database...");
    db.close();
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received, closing database...");
    db.close();
    process.exit(0);
});
