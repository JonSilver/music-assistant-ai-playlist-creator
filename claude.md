# Music Assistant AI Playlist Creator - Operational Instructions

## CRITICAL: Read This First

### DO NOT:
- ❌ **Proliferate code volume** - minimal code only
- ❌ **Create massive modules** - max 200 lines per file
- ❌ **Overcomplicate** - use existing APIs
- ❌ **Add unrequested features**
- ❌ **Assume** - read docs, then ask
- ❌ **Use try/catch** - use @jfdi/attempt only
- ❌ **Use common ports** - 80, 3000, 8080, 8095 reserved

### DO:
- ✅ **Small modules** - single responsibility
- ✅ **Use Music Assistant search API** - don't write matching logic
- ✅ **Read documentation first**
- ✅ **Ask when unclear**
- ✅ **Verify builds** - both frontend and backend must compile

## Code Standards

### TypeScript Rules
```typescript
// Strict mode: true
// No any types
// Explicit return types required
// Max 200 lines per file

// ✅ Error handling - ONLY way allowed
const [err, result] = await attemptPromise(async () => fetchData())
if (err !== undefined) {
  handleError(err)
  return
}

// ❌ BANNED - never use try/catch
try { const result = await fetchData() } catch (err) { }
```

### Prettier Config (Enforced)
```json
{
  "singleQuote": false,
  "trailingComma": "none",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 4
}
```

### React Rules
- Functional components only
- `React.JSX.Element` return type
- `void` for fire-and-forget async: `void myAsyncFunction()`
- React Context for state (no prop drilling)
- Proper dependency arrays

## Project Architecture

**Single Container:** Express serves static React frontend + API
**Frontend:** React 19.2 + Vite + TypeScript + Tailwind + daisyUI
**Backend:** Express + SQLite (settings/history/presets only)
**AI:** Direct browser calls to Claude/OpenAI APIs
**Music Assistant:** Direct browser WebSocket connection

### Data Flow
```
User → Frontend → Music Assistant WS (get favorites)
     → Frontend → AI API (generate tracks)
     → Frontend → Music Assistant WS (search/match)
     → Frontend → Music Assistant WS (create playlist)
```

### Directory Structure
```
frontend/src/
  contexts/        # React Context
  services/        # API clients (use @jfdi/attempt)
  components/      # React components

backend/src/
  routes/          # Express routes
  services/        # MA WebSocket, AI clients
  db/              # SQLite schema

shared/
  types.ts         # Shared types
  constants/       # Organized constants
```

## Music Assistant Integration

**Base URL:** User-configured (e.g., `http://192.168.1.100:8095`)
**WebSocket:** `ws://<server_ip>:8095/ws`
**Auth:** None (local network)

**Use These APIs:**
- `searchTracks(query, limit)` - DON'T write matching logic
- `getFavoriteArtists()` - for AI context
- `createPlaylist(name, provider)`
- `addTracksToPlaylist(playlistId, trackUris)`

**Docs:** `http://<MA_SERVER_IP>:8095/api-docs`

## AI Integration

**Providers:** Claude (Anthropic), OpenAI
**Keys:** User-provided via UI
**Claude Models:** claude-3-5-sonnet-20241022, claude-3-7-sonnet-20250219, claude-opus-4-1-20250805
**OpenAI Models:** gpt-4, gpt-4-turbo-preview, gpt-4o, gpt-4o-mini
**Custom Endpoints:** OpenAI base URL configurable

**Response Format:**
```json
{
  "tracks": [
    { "title": "Track", "artist": "Artist", "album": "Album (optional)" }
  ]
}
```

## Common Mistakes

1. Writing manual track matching (use MA search API)
2. Multi-container setups (single container only)
3. Fake metrics/confidence scores (we don't have them)
4. Port conflicts (avoid 80, 3000, 8080, 8095)
5. Adding player/export/analytics features (out of scope)

## Project Scope

**This is:** Simple home server app, single-user, local network, Docker deployment (port 9876)

**This is NOT:** Enterprise/multi-tenant, a music player, requiring authentication
