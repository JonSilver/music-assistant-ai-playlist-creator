# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Three-tier distributed system with async job processing and real-time progress streaming.

**Key Characteristics:**
- Separate frontend (React) and backend (Express) communicating via REST + SSE
- Asynchronous playlist generation with job polling and Server-Sent Events (SSE) for real-time progress
- Single-user, local network deployment in Docker
- WebSocket integration with Music Assistant for track searching
- Shared type system via Zod schemas in `shared/types.ts`

## Layers

**Presentation (Frontend):**
- Purpose: React user interface for playlist generation, settings, history, and refinement
- Location: `frontend/src/`
- Contains: React components, custom hooks, Context-based state, API clients
- Depends on: Backend API endpoints, React 19, Tailwind + daisyUI
- Used by: End users via web browser

**Business Logic (Frontend Hooks):**
- Purpose: Encapsulate playlist generation flow, track matching, settings management
- Location: `frontend/src/hooks/` - `usePlaylist.ts`, `useSettings.ts`, `useTrackReplace.ts`, `useAlerts.ts`, `useHistoryAndPresets.ts`, `useModals.ts`
- Contains: State management, SSE event handling, form logic
- Depends on: Context providers, backend API services
- Used by: React components

**State Management (Frontend Context):**
- Purpose: Global application state for settings, alerts, provider selection
- Location: `frontend/src/contexts/` - `AppContext.tsx`, `AlertsContext.tsx`
- Contains: React Context providers, localStorage persistence (selected provider)
- Depends on: Backend settings API
- Used by: All components via context hooks

**API Clients (Frontend):**
- Purpose: Encapsulate all backend HTTP communication
- Location: `frontend/src/services/` - `api.ts` (settings), `playlistApi.ts` (playlist operations)
- Contains: Fetch wrappers, SSE event source handling, response parsing
- Depends on: Backend API schema types from `shared/types.ts`
- Used by: Custom hooks and components

**Presentation (Backend):**
- Purpose: Express HTTP/SSE routes for client requests
- Location: `backend/src/routes/` - `playlists.ts`, `settings.ts`, `prompts.ts`, `providers.ts`
- Contains: Request handlers, middleware integration, response construction
- Depends on: Services, database, job store
- Used by: Frontend via API calls

**Business Logic (Backend Services):**
- Purpose: Core playlist generation, AI integration, track matching workflows
- Location: `backend/src/services/`
  - `playlistGenerator.ts` - Main orchestrator for async job (AI → matching → creating)
  - `ai.ts` - Claude/OpenAI API clients with track generation
  - `trackMatching.ts` - Music Assistant WebSocket batch matching (3 retries, exponential backoff)
  - `musicAssistant.ts` - WebSocket client for Music Assistant
  - `playlistCreator.ts` - Playlist creation in Music Assistant
  - `playlistRefine.ts` - AI-driven playlist refinement
  - `jobStore.ts` - In-memory job state with listener pattern
  - `webhook.ts` - Async webhook notifications
- Depends on: Database, external APIs
- Used by: Routes, each other

**Data Access (Database):**
- Purpose: SQLite persistence for settings, prompt history, preset prompts
- Location: `backend/src/db/schema.ts`
- Contains: `PlaylistDatabase` class with tables: `settings`, `prompt_history`, `preset_prompts`
- Depends on: better-sqlite3
- Used by: Services, routes

**Utilities:**
- Backend: `backend/src/utils/` - `trackUtils.ts`, `maClientUtils.ts`, `providerUtils.ts`, `sortByProviderWeight.ts`
- Backend: `backend/src/middleware/` - `validation.ts` (Zod request validation)
- Frontend: `frontend/src/utils/` - `fetchUtils.ts` (backendFetch wrapper), `parseProviderKeywords.ts`, `modelLoader.ts`

## Data Flow

**Playlist Generation (Primary Flow):**

1. User enters prompt in `PlaylistCreatorForm.tsx` → triggers `usePlaylist.generatePlaylist()`
2. Frontend calls `generatePlaylistViaBackend()` (POST `/api/playlists/generate`)
3. Backend `setupPlaylistsRoutes()` creates job UUID, stores in `jobStore`, starts async `generatePlaylistJob()`
4. Frontend opens EventSource (SSE) to `/api/playlists/jobs/{jobId}/stream` for real-time updates
5. Backend job orchestration:
   - Step 1: AI generation via `generatePlaylistAI()` (Claude or OpenAI) → track suggestions
   - Step 2: Initialize tracks with `createUnmatchedTracks()` (all `matching: true` to prevent "NOT FOUND" flash)
   - Step 3: Batch match via `matchTracksProgressively()` (Music Assistant WebSocket, retry logic)
   - Updates `jobStore` on each batch completion → SSE notifies frontend
   - If webhook URL provided: auto-creates playlist and calls webhook
   - If no webhook: just completes with matched tracks for UI to decide
6. Frontend receives SSE updates → updates `generatedTracks` state in real-time
7. User reviews matched tracks, optionally refines or creates playlist

**Playlist Creation:**

1. User clicks "Create Playlist" with matched tracks
2. Frontend calls `createPlaylistViaBackend()` (POST `/api/playlists/create`)
3. Backend calls `createPlaylist()` → Music Assistant REST API
4. Returns `playlistId`, `playlistUrl`, `tracksAdded`
5. Backend saves to `prompt_history` table
6. Frontend shows success with playlist link

**Playlist Refinement:**

1. User clicks "Refine Playlist" with refinement prompt and current tracks
2. Frontend calls `refinePlaylistViaBackend()` (POST `/api/playlists/refine`)
3. Backend calls `refinePlaylist()` → AI generates replacement suggestions
4. Each track re-matched via Music Assistant
5. Returns refined `TrackMatch[]` array
6. Frontend replaces current tracks with refined set

**Track Retry:**

1. User clicks retry button on unmatched track
2. Frontend calls `retryTrackViaBackend()` (POST `/api/playlists/tracks/retry`)
3. Backend calls `matchTrack()` with Music Assistant WebSocket
4. Returns updated `TrackMatch` with new attempt
5. Frontend updates single track in array

**Track Replace:**

1. User clicks replace icon on unwanted track
2. Frontend calls `replaceTrackViaBackend()` (POST `/api/playlists/tracks/replace`)
3. Backend calls `replaceTrack()` → AI suggests replacement for context (original prompt + playlist name)
4. Replacement matched via Music Assistant
5. Returns new `TrackMatch`
6. Frontend replaces track in array

**Settings Management:**

1. Frontend loads settings on app init via `useApp()` (AppContext)
2. Calls `api.getSettings()` (GET `/api/settings`) → returns `AppSettings`
3. User edits settings in `SettingsView` → calls `updateSettings()`
4. Backend updates SQLite `settings` table
5. Frontend refreshes and persists `selectedProviderId` to localStorage

**State Update Propagation:**

- Settings: Loaded once at app start, refreshed on update
- Playlist state: Driven by `usePlaylist()` hook (component-level state via `useState()`)
- Alerts/toasts: Via `AlertsContext` (global via React Context)
- Modal visibility: Via `useModals()` (local state)
- Provider selection: Stored in `AppContext` + localStorage

## Key Abstractions

**TrackMatch:**
- Purpose: Represents a suggested track with matching results
- Examples: `shared/types.ts` - `TrackMatchSchema`
- Pattern: Contains original suggestion, matched flag, optional Music Assistant results, selected index
- Criticality: Core to entire playlist matching flow; initialised with `matching: true`

**AIProviderConfig:**
- Purpose: Configuration for Claude or OpenAI provider
- Examples: `shared/types.ts` - `AIProviderConfigSchema`
- Pattern: Provider type + API key/endpoint details
- Used in: AI generation, provider selection

**PlaylistGenerationJob:**
- Purpose: Tracks async job state and progress
- Examples: `backend/src/types/jobs.ts`
- Pattern: Status enum (pending → generating_ai → matching_tracks → creating_playlist → completed/failed)
- Used in: `jobStore`, SSE updates, job polling

**JobStore:**
- Purpose: In-memory store for active jobs with listener pattern
- Examples: `backend/src/services/jobStore.ts`
- Pattern: Map-based storage, listener callbacks on update, auto-cleanup after 1 hour
- Used in: Playlist generation, SSE streaming

**MusicAssistantClient:**
- Purpose: WebSocket wrapper for Music Assistant API
- Examples: `backend/src/services/musicAssistant.ts`
- Pattern: Connect/disconnect lifecycle, reconnect on error, retry queue
- Used in: Track matching, favorite artists retrieval

## Entry Points

**Backend:**
- Location: `backend/src/server.ts`
- Triggers: Application startup
- Responsibilities: Express setup, middleware, route registration, database initialization, graceful shutdown

**Frontend:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser page load
- Responsibilities: React root mount, provider wrapping (AppProvider, AlertsProvider, ErrorBoundary)

**Frontend App Component:**
- Location: `frontend/src/App.tsx`
- Triggers: Rendered by main.tsx
- Responsibilities: Layout selection (SettingsView vs MainView), hook initialization, conditional rendering

## Error Handling

**Strategy:** No try/catch; use `@jfdi/attempt` for sync and `attemptPromise` for async operations.

**Patterns:**
- Backend: All services return attempt tuple `[err, result]` checked before use
- Frontend: All API calls wrapped in `attemptPromise` with error capture
- Middleware: Request validation via `validateRequest()` middleware returns 400 on schema mismatch
- Routes: Services return explicit error responses (500, 400) with details
- Job errors: Stored in `jobStore`, sent via SSE to frontend, persisted in job update
- WebSocket errors: Auto-reconnect in Music Assistant client

**User Feedback:**
- Success messages: Via `AlertsContext` (top-level toast)
- Error messages: Via `useAlerts()` hook, displayed in `AlertMessage.tsx`

## Cross-Cutting Concerns

**Logging:** Console.log for job progress, errors, connection events (no structured logging framework)

**Validation:**
- Backend: Zod schemas in `shared/types.ts` + `middleware/validation.ts` middleware
- Frontend: Manual validation in hooks (e.g., `usePlaylist` checks prompt length)

**Authentication:** None required (single-user, local network); Music Assistant token optional (stored as env var)

**Type Safety:** TypeScript strict mode, shared `shared/types.ts` for all API contracts, `import type {}` syntax

**Provider Weighting:** `backend/src/utils/sortByProviderWeight.ts` filters Music Assistant search results by provider preference

**Retry Logic:**
- Track matching: 3 attempts with exponential backoff (1s, 2s delays)
- WebSocket: Auto-reconnect on disconnect
- Batch processing: 100ms delay between batches to avoid overwhelming Music Assistant

