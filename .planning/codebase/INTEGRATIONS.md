# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**AI Providers:**
- Claude (Anthropic) - Playlist track suggestion generation
  - SDK: `@anthropic-ai/sdk` 0.68.0
  - Auth: `ANTHROPIC_API_KEY` (configured per-provider in settings)
  - Model: Configurable (default varies by provider)
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\ai.ts`

- OpenAI - Playlist track suggestion generation (alternative to Claude)
  - SDK: `openai` 6.8.1
  - Auth: `OPENAI_API_KEY` (configured per-provider in settings)
  - Model: Configurable
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\ai.ts`

- OpenAI-Compatible Endpoints - Custom API endpoints compatible with OpenAI SDK
  - SDK: `openai` 6.8.1
  - Auth: Custom API key (configured per-provider in settings)
  - Base URL: Configurable per provider
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\ai.ts`

**Music Assistant:**
- Music Assistant Server (WebSocket API)
  - Protocol: WebSocket (`ws://` or `wss://`)
  - Path: `/ws`
  - Client: `ws` 8.18.0
  - Auth: Optional token (required for Music Assistant 2.7+)
  - Device name: `music-assistant-ai-playlist-creator`
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\musicAssistant.ts`
  - Commands:
    - `auth` - Authenticate with token
    - `music/search` - Search for tracks (max 5 results per query)
    - `music/favorites` - Retrieve favourites
    - `music/library_items` - Get library items
    - `music/playlists/create_playlist` - Create playlist
    - `music/playlists/add_playlist_tracks` - Add tracks to playlist

## Data Storage

**Databases:**
- SQLite (better-sqlite3 12.4.1)
  - Connection: Local file-based
  - Path: Development: `./data/playlists.db`, Production: `/app/data/playlists.db`
  - Client: better-sqlite3 (synchronous wrapper)
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\db\schema.ts`
  - Schema:
    - `settings` table - Application configuration key-value store
    - `prompt_history` table - User prompt history for future reference
    - `preset_prompts` table - Pre-configured playlist prompt templates

**File Storage:**
- Local filesystem only - No external file storage (frontend built assets served statically)

**Caching:**
- In-memory job store - Playlist generation jobs cached in memory during processing
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\jobStore.ts`
  - Purpose: Track SSE progress updates and job status

## Authentication & Identity

**Auth Provider:**
- Custom (no external auth provider)
  - Approach: None - Single-user local network application
  - Music Assistant integration uses optional token-based auth for WebSocket connection

**Configuration:**
- AI provider credentials stored in SQLite `settings` table as encrypted/plain JSON
- Implementation: `C:\Dev\music-assistant-ai-playlist-creator\shared\settings-schema.ts`

## Monitoring & Observability

**Error Tracking:**
- None - Application logs to console/stdout
- Error handling via `@jfdi/attempt` utility (sync) and `attemptPromise` (async)

**Logs:**
- Console output to stdout
- Example logs:
  - `console.log("Using database at: ${dbPath}")`
  - `console.log("Server running on port ${PORT}")`
  - `console.error("Failed to parse MA message:", err)`

**Healthcheck:**
- GET `/api/health` endpoint
  - Returns: `{ status: "ok", timestamp: "ISO-8601 string" }`
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\server.ts` (lines 70-72)

## CI/CD & Deployment

**Hosting:**
- Docker (self-hosted single container)
- Docker Compose orchestration for local/home server deployment

**CI Pipeline:**
- Not detected - No GitHub Actions or CI service configured
- Manual docker-compose up deployment

**Build Process:**
- Multi-stage Docker build:
  1. `deps` stage - Install all dependencies
  2. `build` stage - Compile frontend and backend
  3. `runtime` stage - Create minimal production image

## Environment Configuration

**Required environment variables (Development):**
- `BACKEND_PORT` - Backend API port (default: 3333)
- `FRONTEND_PORT` - Frontend dev server port (default: 5555)
- `VITE_BACKEND_PORT` - Frontend's backend connection port (default: 3333)

**Required environment variables (Production/Docker):**
- `PORT` or `APP_PORT` - Application port (default: 9876)
- `DATABASE_PATH` - SQLite database location (default: `/app/data/playlists.db`)
- `NODE_ENV` - Set to `production`

**Settings stored in Database (not env vars):**
- `musicAssistantUrl` - Music Assistant server URL (required at runtime)
- `systemPrompt` - Custom AI system prompt (optional)
- `favoriteArtists` - User's favourite artists (optional)
- `trackCount` - Number of tracks to generate (default: 25)
- `aiProviders` - Array of configured AI providers with credentials
  - Schema: `C:\Dev\music-assistant-ai-playlist-creator\shared\settings-schema.ts`
  - Each provider: `{ id, name, type, apiKey, model, baseUrl (optional), temperature (optional) }`

**Secrets location:**
- SQLite database in `settings` table
- AI provider API keys stored as part of provider configuration JSON

## Webhooks & Callbacks

**Incoming:**
- None configured - Application does not expose webhook endpoints

**Outgoing:**
- Optional webhook URL for async playlist generation jobs
  - Parameter: `webhookUrl` in POST `/api/playlists/generate` request
  - Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\webhook.ts`
  - Purpose: Notify external system when playlist generation completes
  - Status updates sent via Server-Sent Events (SSE) to frontend

## Server-Sent Events (SSE)

**Progress Updates:**
- Endpoint: GET `/api/playlists/jobs/:jobId/stream`
- Purpose: Stream real-time playlist generation progress to frontend
- Status values: `pending`, `generating_ai`, `matching_tracks`, `creating_playlist`, `completed`, `failed`
- Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\services\jobStore.ts`

## CORS

**Configuration:**
- CORS enabled globally via middleware
- Client: `cors` 2.2.5
- Implementation: `C:\Dev\music-assistant-ai-playlist-creator\backend\src\server.ts` (line 43)
- Allows requests from frontend (dev: http://localhost:5555, prod: same container)

---

*Integration audit: 2026-01-23*
