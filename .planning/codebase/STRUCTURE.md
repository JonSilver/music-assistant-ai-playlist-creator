# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
project-root/
├── .claude/                          # Claude Code settings
├── .github/                          # GitHub workflows for CI
├── .planning/                        # GSD planning documents
│   └── codebase/                    # Codebase analysis (ARCHITECTURE.md, etc.)
├── .vscode/                          # VS Code settings
├── backend/                          # Express API server
│   ├── src/
│   │   ├── db/                      # SQLite schema and database class
│   │   ├── middleware/              # Express middleware (validation)
│   │   ├── routes/                  # API route handlers
│   │   ├── services/                # Business logic (AI, matching, jobs)
│   │   ├── types/                   # Backend-specific types
│   │   ├── utils/                   # Utility functions
│   │   └── server.ts                # Express app entry point
│   ├── dist/                        # Compiled JavaScript output
│   ├── data/                        # SQLite database files (local dev)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                         # React web UI
│   ├── src/
│   │   ├── assets/                  # Static images, icons
│   │   ├── components/              # React components
│   │   ├── contexts/                # React Context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API client functions
│   │   ├── utils/                   # Frontend utilities
│   │   ├── App.tsx                  # Root app component
│   │   ├── main.tsx                 # React root mount
│   │   └── index.css                # Global styles
│   ├── public/                      # Static HTML, favicons
│   ├── dist/                        # Built frontend (Vite output)
│   ├── package.json
│   └── vite.config.ts
├── shared/                           # Shared code between frontend and backend
│   ├── types.ts                     # ALL shared API contracts (Zod schemas + types)
│   ├── constants/                   # Shared constants (API endpoints, ports)
│   └── settings-schema.ts           # Settings schema and utilities
├── docs/                             # Project documentation
├── data/                             # SQLite database directory (Docker mounted)
├── devscripts/                       # Development helper scripts
├── scripts/                          # Build and deployment scripts
├── Dockerfile                        # Single-stage Docker build
├── docker-compose.yml                # Production compose file
├── docker-compose.dev.yml            # Development compose file
├── entrypoint.sh                     # Docker entrypoint script
├── CLAUDE.md                         # Development guidelines
├── APP_SPECIFICATION.md              # Feature specification
├── DEPLOYMENT.md                     # Deployment instructions
├── package.json                      # Root workspace package (npm workspaces)
└── knip.json                         # Unused code detection config
```

## Directory Purposes

**backend/src/db:**
- Purpose: SQLite database schema and ORM-like class
- Contains: `schema.ts` with `PlaylistDatabase` class
- Key files: `backend/src/db/schema.ts` (331 lines) - tables: settings, prompt_history, preset_prompts

**backend/src/middleware:**
- Purpose: Express middleware functions
- Contains: Request/response interceptors
- Key files: `backend/src/middleware/validation.ts` - Zod schema validation middleware

**backend/src/routes:**
- Purpose: Express route handlers for all API endpoints
- Contains: Route definitions, request handlers, response construction
- Key files:
  - `backend/src/routes/playlists.ts` (321 lines) - Generate, create, refine, retry, replace endpoints
  - `backend/src/routes/settings.ts` - Settings CRUD
  - `backend/src/routes/prompts.ts` - Prompt history and presets
  - `backend/src/routes/providers.ts` - AI provider management

**backend/src/services:**
- Purpose: Business logic and external integrations
- Contains: Playlist generation, AI calls, track matching, job management
- Key files:
  - `backend/src/services/playlistGenerator.ts` (155 lines) - Main async job orchestrator
  - `backend/src/services/ai.ts` - Claude/OpenAI API clients
  - `backend/src/services/trackMatching.ts` - Music Assistant batch matching with retry
  - `backend/src/services/musicAssistant.ts` - WebSocket client
  - `backend/src/services/playlistCreator.ts` - Playlist creation
  - `backend/src/services/playlistRefine.ts` - Playlist refinement
  - `backend/src/services/jobStore.ts` (106 lines) - In-memory job state + listener pattern
  - `backend/src/services/webhook.ts` - Webhook notifications

**backend/src/types:**
- Purpose: Backend-specific TypeScript interfaces
- Contains: Job types, internal DTOs
- Key files: `backend/src/types/jobs.ts` - Job status and progress types

**backend/src/utils:**
- Purpose: Shared utility functions used by services and routes
- Contains: Track initialisation, provider filtering, Music Assistant client helpers
- Key files:
  - `backend/src/utils/trackUtils.ts` - `createUnmatchedTracks()` helper
  - `backend/src/utils/maClientUtils.ts` - `withMusicAssistant()` connection wrapper
  - `backend/src/utils/providerUtils.ts` - `selectProvider()` function
  - `backend/src/utils/sortByProviderWeight.ts` - Provider filtering logic

**frontend/src/components:**
- Purpose: React UI components
- Contains: Page layouts, form components, display components
- Key files:
  - `frontend/src/components/MainView.tsx` - Primary UI page
  - `frontend/src/components/SettingsView.tsx` - Settings management page
  - `frontend/src/components/PlaylistCreatorForm.tsx` - Input form
  - `frontend/src/components/GeneratedTracksDisplay.tsx` - Track list display
  - `frontend/src/components/ProvidersManager.tsx` - AI provider configuration
  - Others: AlertMessage, LoadingButton, RefinePlaylistModal, HistoryModal, etc.

**frontend/src/contexts:**
- Purpose: React Context providers for global state
- Contains: Settings state, alert state
- Key files:
  - `frontend/src/contexts/AppContext.tsx` - Settings, provider selection, loading state
  - `frontend/src/contexts/AlertsContext.tsx` - Alert/toast state

**frontend/src/hooks:**
- Purpose: Custom React hooks encapsulating logic
- Contains: Playlist generation flow, settings management, modal state
- Key files:
  - `frontend/src/hooks/usePlaylist.ts` (269 lines) - Main playlist generation logic
  - `frontend/src/hooks/useSettings.ts` - Settings loading/updating
  - `frontend/src/hooks/useTrackReplace.ts` - Single track replacement
  - `frontend/src/hooks/useAlerts.ts` - Toast/alert management
  - `frontend/src/hooks/useHistoryAndPresets.ts` - History and preset loading

**frontend/src/services:**
- Purpose: API client functions
- Contains: HTTP fetch wrappers, SSE handling
- Key files:
  - `frontend/src/services/api.ts` - Settings endpoints
  - `frontend/src/services/playlistApi.ts` (149 lines) - Playlist operations with SSE streaming

**frontend/src/utils:**
- Purpose: Frontend utility functions
- Contains: Fetch wrappers, provider keyword parsing, model loading
- Key files:
  - `frontend/src/utils/fetchUtils.ts` - `backendFetch()` wrapper with error handling
  - `frontend/src/utils/parseProviderKeywords.ts` - Parse provider weight syntax
  - `frontend/src/utils/modelLoader.ts` - Dynamic model selection

**shared/:**
- Purpose: Shared code and types between frontend and backend
- Contains: Zod schemas, constants, settings definitions
- Key files:
  - `shared/types.ts` - **SINGLE SOURCE OF TRUTH** for all API contracts
  - `shared/constants/` - API endpoints, ports, defaults
  - `shared/settings-schema.ts` - Settings definition and utilities

## Key File Locations

**Entry Points:**
- Backend: `backend/src/server.ts` - Express app initialization
- Frontend: `frontend/src/main.tsx` - React root mount
- Frontend App: `frontend/src/App.tsx` - Root component

**Configuration:**
- Environment: `.env` file (copied to Docker `/app/.env`)
- Backend config: `backend/tsconfig.json`, `backend/package.json`
- Frontend config: `frontend/vite.config.ts`, `frontend/tsconfig.json`
- Database path: Dev = `data/playlists.db`, Prod = `/app/data/playlists.db`

**Core Logic:**
- Playlist generation: `backend/src/services/playlistGenerator.ts`
- AI integration: `backend/src/services/ai.ts`
- Track matching: `backend/src/services/trackMatching.ts`
- Frontend flow: `frontend/src/hooks/usePlaylist.ts`

**Testing:**
- Not yet implemented (no test files present)

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `GeneratedTracksDisplay.tsx`)
- Services: camelCase (e.g., `playlistApi.ts`, `musicAssistant.ts`)
- Utilities: camelCase (e.g., `fetchUtils.ts`)
- Types: lowercase (e.g., `jobs.ts`)

**Directories:**
- Feature directories: lowercase plural (e.g., `components`, `services`, `hooks`)
- Monorepo packages: lowercase (e.g., `backend`, `frontend`, `shared`)

**Exports:**
- Type-only exports: Use `import type { Foo }` (not `import { type Foo }`)
- Component exports: Default export as `React.FC<IPropsInterface>`
- Service exports: Named exports (e.g., `export const generatePlaylistViaBackend`)
- Schemas: Named exports with `Schema` suffix (e.g., `TrackMatchSchema`)

**Interfaces:**
- All interfaces prefixed with `I` (e.g., `IUser`, `IApiResponse`)
- No `Props` suffix on component props (convention: `interface IComponentNameProps`)

## Where to Add New Code

**New Backend Feature:**
- Route handler: `backend/src/routes/{feature}.ts`
- Business logic: `backend/src/services/{feature}.ts`
- Database: Add table to `backend/src/db/schema.ts`
- Types: Backend-specific types in `backend/src/types/`
- API contract types: Add to `shared/types.ts` with Zod schema

**New Frontend Feature:**
- Page/section: Create component in `frontend/src/components/{FeatureName}.tsx`
- State management: Create hook in `frontend/src/hooks/use{FeatureName}.ts`
- API calls: Add to `frontend/src/services/api.ts` or create new service file
- Global state: Add to appropriate Context or new Context in `frontend/src/contexts/`

**New Utility Function:**
- Backend utilities: `backend/src/utils/{name}.ts`
- Frontend utilities: `frontend/src/utils/{name}.ts`
- Shared utilities: Not present (shared/ is types-only)

**New Middleware:**
- Location: `backend/src/middleware/{name}.ts`
- Register: In `backend/src/server.ts` via `app.use()`

## Special Directories

**backend/dist:**
- Purpose: Compiled JavaScript output from TypeScript
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)
- Contents: Compiled backend code, frontend build copied here for serving

**frontend/dist:**
- Purpose: Vite-built frontend output
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)
- Contents: index.html, JavaScript bundles, CSS, assets

**data/ and backend/data/**
- Purpose: SQLite database storage
- Generated: Yes (auto-created if missing)
- Committed: No (in .gitignore)
- Dev location: `data/playlists.db` relative to project root
- Prod location: `/app/data/playlists.db` in Docker container

**.planning/codebase/**
- Purpose: GSD codebase analysis documents (this document, ARCHITECTURE.md, etc.)
- Generated: Yes (by GSD agent)
- Committed: Yes (tracked in git)

**docs/:**
- Purpose: Project documentation
- Contains: Feature docs, API specs, deployment guides

