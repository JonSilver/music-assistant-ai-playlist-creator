# Music Assistant AI Playlist Creator - Development Guide

## Code Quality Standards

### Critical Rules
- **NO code duplication** - Define entities (types/schemas/interfaces) AND functions in ONE place only
- **Shared types in shared/** - All API contracts live in `shared/types.ts`
- **Import types correctly** - Use `import type {}` for type-only imports, not `import { type ... }`
- **Max 200 lines per file** - Break up larger modules
- **No `any` types** - Explicit types always
- **Use @jfdi/attempt** - Never use try/catch, always use `attempt` (sync) or `attemptPromise` (async)
- **Run knip regularly** - Delete unused code/exports immediately
- **Explicit return types** - All functions must have return types
- **TypeScript strict mode** - Enforced

### Error Handling
```typescript
// ✅ Async operations
const [err, result] = await attemptPromise(async () => fetchData())
if (err !== undefined) {
  handleError(err)
  return
}

// ✅ Sync operations
const [err, result] = attempt(() => JSON.parse(data))
if (err !== undefined) {
  handleError(err)
  return
}

// ❌ BANNED
try { ... } catch { ... }
```

### Shared Types Pattern
```typescript
// shared/types.ts - Single source of truth
export const FooSchema = z.object({ ... })
export type Foo = z.infer<typeof FooSchema>

// Backend - uses for validation + response typing
import { FooSchema } from "@shared/types.js"
import type { Foo } from "@shared/types.js"

// Frontend - uses for API typing
import type { Foo } from "@shared/types"
```

### Import Syntax
```typescript
// ✅ Correct
import type { Foo, Bar } from "./types.js"
import { schema, function } from "./file.js"

// ❌ Wrong
import { type Foo, type Bar } from "./types.js"
```

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind + daisyUI
- **Backend:** Express + TypeScript + SQLite
- **Deployment:** Single Docker container (port 9876)
- **AI Providers:** Claude (Anthropic), OpenAI (configurable endpoints)
- **Music Assistant:** WebSocket client

### Request Flow
```
User → Frontend UI
     → Backend API (Express)
        → AI Provider (track suggestions)
        → Music Assistant WebSocket (search/match/create)
        → SQLite (settings/history)
     ← Server-Sent Events (progress updates)
     ← JSON responses
```

### Directory Structure
```
frontend/src/
  components/      # React components
  contexts/        # React Context (state management)
  hooks/           # Custom React hooks
  services/        # Backend API clients

backend/src/
  routes/          # Express route handlers
  services/        # Business logic
  db/              # SQLite schema

shared/
  types.ts         # ALL shared types/schemas
  constants/       # Shared constants
  settings-schema.ts
```

## Key Backend Services

- **playlistGenerator.ts** - Main playlist generation job with SSE progress updates
- **playlistRefine.ts** - Refine existing playlist, replace individual tracks
- **trackMatching.ts** - Batch track matching with retry logic (3 attempts, exponential backoff)
- **musicAssistant.ts** - WebSocket client for Music Assistant API
- **ai.ts** - AI provider clients (Claude, OpenAI, custom endpoints)
- **playlistCreator.ts** - Create playlists in Music Assistant
- **jobStore.ts** - In-memory job state with SSE listeners

## Key Frontend Services

- **playlistApi.ts** - Backend API client (all endpoints)
- **usePlaylist.ts** - Main playlist generation hook
- **useApp.ts** - Global app state (settings, providers)

## Music Assistant Integration

- **WebSocket:** `ws://<server>:8095/ws`
- **Search API:** Returns max 5 results per query
- **Retry Logic:** 3 attempts with exponential backoff (1s, 2s delay)
- **Batch Processing:** Matches tracks in batches of 10, 100ms delay between batches
- **Provider Keywords:** Optional filtering for preferred music providers

## AI Integration

- **Providers:** Claude (Anthropic), OpenAI
- **Track Count:** User-configurable (default 25)
- **System Prompt:** Customizable per-installation
- **Response Format:** JSON with playlistName + array of {title, artist, album}

## Common Patterns

### Backend Response Construction
```typescript
// Always use typed variable
const response: BackendFooResponse = {
  success: true,
  data: result
}
res.json(response)

// Never inline
res.json({ success: true, data: result })  // Wrong!
```

### Frontend API Calls
```typescript
const [err, result] = await attemptPromise(async () => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json() as Promise<BackendFooResponse>
})
if (err !== undefined) {
  setError(err.message)
  return
}
// Use result
```

### Track Initialization
```typescript
// ALL tracks MUST start with matching: true
const tracks: TrackMatch[] = suggestions.map(s => ({
  suggestion: s,
  matched: false,
  matching: true  // Critical - prevents "NOT FOUND" flash
}))
```

### React Patterns
- Functional components only (React.FC)
- `void` for fire-and-forget async: `void myAsyncFunction()`
- React Context for state (no prop drilling)
- Proper dependency arrays in useEffect/useCallback

## Common Mistakes to Avoid

1. **Duplicate type definitions** - Same interface in frontend + backend
2. **Inline response objects** - Not using typed variables
3. **Wrong import syntax** - `import { type Foo }` instead of `import type { Foo }`
4. **Initializing with `matching: false`** - Causes UI to show "NOT FOUND" before matching starts
5. **Not retrying on 0 results** - Music Assistant search can return empty on first try
6. **Using try/catch** - Banned, use @jfdi/attempt
7. **Letting unused code accumulate** - Run knip regularly
8. **Forgetting `/** @public */`** - Required for cross-workspace exports

## Development Workflow

1. `npm run build` - Verify both frontend and backend compile
2. `npm run lint` - Fix all linting errors
3. `npm run knip` - Check for unused code/exports
4. Test full flow: generate → match → refine → create playlist
5. Verify SSE progress updates display correctly in UI

## Project Scope

**This is:**
- Simple home server app
- Single-user, local network
- Docker deployment
- No authentication required

**This is NOT:**
- Enterprise/multi-tenant system
- A music player
- Requiring user authentication
- Supporting remote/cloud deployment
