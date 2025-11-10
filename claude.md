# Music Assistant AI Playlist Creator

## CRITICAL: Behavioral Guidelines

**READ THIS FIRST. FOLLOW STRICTLY.**

### DO NOT:

- ❌ **Create Massive Modules** - decompose, tiny modules only, single responsibility
- ❌ **Overcomplicate solutions** - Use existing APIs, don't write custom logic
- ❌ **Add features not requested** - Stick to what the user asked for
- ❌ **Assume implementation details** - Read documentation first
- ❌ **Create separate containers** - This is a home server app, single container only
- ❌ **Use common ports** - 80, 3000, 8080 are all unacceptable
- ❌ **Add documentation in user-facing README** - Technical details go in claude.md only
- ❌ **Make defensive assumptions** - If unclear, ASK
- ❌ **Write code as a "demonstration"** - Write minimal, correct code only
- ❌ **Add roadmap bloat** - No features that don't make sense for a playlist creator
- ❌ **Use try/catch** - Use @jfdi/attempt with tuple destructuring
- ❌ **Use .ok/.value pattern** - Use `[err, result]` destructuring


### DO:
- ✅ **Decompose into small modules** - Single responsibility, tiny functions
- ✅ **Use existing APIs** - Music Assistant has search, use it
- ✅ **Read the documentation** - Check what APIs exist before writing code
- ✅ **Follow user instructions exactly** - Don't interpret, follow literally
- ✅ **Keep it simple** - Single container, simple architecture
- ✅ **Ask when unclear** - Better to ask than assume wrong
- ✅ **Test your thinking** - Does this make sense for a home server?
- ✅ **Verify builds work** - Both frontend and backend must compile cleanly
- ✅ **Use tuple destructuring** - `const [err, result] = await attempt(...)`

### Common Mistakes to Avoid:
1. **Writing manual matching logic** when Music Assistant has search API
2. **Creating multi-container setups** when a single container works fine
3. **Adding fake metrics** like confidence scores when we don't have them
4. **Port conflicts** - avoid 80, 3000, 8080, 8095 (MA uses this)
5. **Roadmap pollution** - no player integration, export features, analytics
6. **Over-engineering** - this is a simple home server app

### This Project Is:
- A simple home server application
- Single-user, local network only
- Settings configured via web UI
- Data stored in SQLite
- Docker deployment with volume mapping

### This Project Is NOT:
- An enterprise application
- Multi-tenant
- A music player (Music Assistant is the player)
- A streaming service
- Requiring authentication

## Project Overview

This project provides an AI-assisted playlist creation interface for Music Assistant. Users describe their desired playlist in natural language, and the AI generates a curated playlist by selecting tracks from their existing Music Assistant library.

## Architecture

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **State Management**: React Context
- **Styling**: Tailwind CSS + daisyUI
- **UI Components**: daisyUI (Tailwind-based component library)
- **API Communication**: Native fetch API with @jfdi/attempt error handling
- **Error Handling**: @jfdi/attempt (try/catch banned)

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript (strict mode)
- **Database**: SQLite (for settings, prompt history, presets)
- **AI Integration**: Claude API and OpenAI API (user selects via UI)
- **Music Assistant Integration**: WebSocket API using `ws` library
- **WebSocket Library**: `ws` for MA connection
- **Error Handling**: @jfdi/attempt

### Music Assistant Details
- **What it is**: Open-source media library manager (Python-based)
- **Deployment**: Runs on local network device (Raspberry Pi, NAS, Intel NUC)
- **Default Port**: 8095
- **API Type**: WebSocket with partial REST exposure
- **Authentication**: None required (local network access)
- **API Documentation**: Auto-generated at `http://<MA_SERVER_IP>:8095/api-docs`
- **Client Libraries**:
  - Python: https://github.com/music-assistant/client
  - TypeScript reference: https://github.com/music-assistant/frontend

### Architecture Flow
```
User Input (Prompt)
    ↓
Frontend (React + daisyUI)
    ↓
Backend API Server
    ↓
Backend Fetches User's Favorite Artists (for AI context)
    ↓
AI Service (Claude/OpenAI)
    ↓
AI Returns Structured Track List
    ↓
Backend Searches MA Library (via MA search API)
    ↓
Backend Matches Tracks & Creates Playlist
    ↓
Response to Frontend (with match results)
```

## Core Features (Implemented)

### 1. Playlist Prompt Interface ✅
- Text input for natural language playlist description
- Preset prompts (workout, chill, party, focus, road trip)
- Prompt history with timestamp tracking
- Playlist name input

### 2. AI Processing ✅
- Support for Claude (Anthropic) and OpenAI
- Custom OpenAI base URL support (for compatible endpoints)
- Structured JSON response with track suggestions
- User's favorite artists included in AI context
- Request format:
  ```json
  {
    "tracks": [
      {
        "title": "Track Name",
        "artist": "Artist Name",
        "album": "Album Name (optional)"
      }
    ]
  }
  ```

### 3. Music Assistant Integration ✅
- WebSocket connection to MA instance
- Retrieve user's favorite artists for AI context
- Track matching using MA's search API
- Create playlist via MA API
- Add matched tracks to playlist
- Handle missing tracks gracefully

### 4. Results Display ✅
- Show matched tracks with green "Found" badge
- Show unmatched tracks grayed out with red "Not Found" badge
- Allow manual track removal before playlist creation
- Preview entire playlist before committing
- Success/error notifications using daisyUI alerts

### 5. Settings Management ✅
- Music Assistant URL configuration
- AI provider selection (Claude/OpenAI)
- API key management (Anthropic/OpenAI)
- OpenAI base URL for compatible endpoints
- Connection testing for MA, Anthropic, and OpenAI
- Customizable temperature (0-2) for AI creativity
- Custom system prompts
- All settings stored in SQLite and configurable via UI

## Code Quality Standards

### TypeScript
- Strict mode enabled (`strict: true`)
- No `any` types - use proper typing
- Explicit function return types required
- Strict boolean expressions
- No floating promises
- No unused variables/parameters

### Code Style (Enforced)
- **No trailing commas** (`trailingComma: "none"`)
- **Arrow functions preferred** over traditional functions
- **No unnecessary braces** on single-line arrow functions
- **@jfdi/attempt for error handling** - try/catch is banned
- **Error-first destructuring**: `const [err, result] = await attemptPromise(...)`
- **Check errors**: `if (err !== undefined)` not `if (!result.ok)`
- **Single quotes** for strings
- **No semicolons**
- **100 character line width**

### React Best Practices
- Functional components only
- Custom hooks for reusable logic
- Proper dependency arrays in hooks
- React Context for global state
- Avoid prop drilling
- Use React 19's `React.JSX.Element` return type
- Always use `void` for fire-and-forget async calls: `void myAsyncFunction()`

### Anti-patterns to Avoid
- ❌ Mutating state directly
- ❌ Using index as key in lists (unless list is static)
- ❌ Storing derived state
- ❌ Unnecessary useEffect
- ❌ Prop drilling (use context/composition)
- ❌ Missing cleanup in effects
- ❌ Using `try/catch` (use @jfdi/attempt instead)
- ❌ Creating unnecessary wrapper functions/types

### Error Handling Pattern
```typescript
// ✅ Correct - using attemptPromise
const [err, result] = await attemptPromise(async () => fetchData())
if (err !== undefined) {
  handleError(err)
  return
}
// use result safely

// ❌ Wrong - don't use try/catch
try {
  const result = await fetchData()
} catch (err) {
  handleError(err)
}
```

## Project Structure (Actual)

```
/
├── frontend/               # React application
│   ├── src/
│   │   ├── contexts/      # React Context providers
│   │   │   └── AppContext.tsx
│   │   ├── services/      # API clients
│   │   │   └── api.ts    # Backend API client with @jfdi/attempt
│   │   ├── App.tsx       # Main application with full UI
│   │   ├── main.tsx      # Entry point
│   │   └── index.css     # Tailwind imports
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js  # daisyUI configuration
│   ├── eslint.config.js    # Strict TypeScript + Prettier rules
│   └── nginx.conf         # Nginx config for frontend
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── routes/        # Express routes
│   │   │   ├── playlist.ts # Playlist creation endpoints
│   │   │   ├── prompts.ts  # History and presets
│   │   │   └── settings.ts # Settings CRUD + test endpoints
│   │   ├── services/
│   │   │   ├── ai.ts     # AI service (Claude + OpenAI)
│   │   │   └── musicAssistant.ts # MA WebSocket client
│   │   ├── db/           # SQLite database
│   │   │   └── schema.ts # DB schema with settings/history/presets
│   │   └── server.ts     # Express app with CORS and graceful shutdown
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # Shared types between frontend/backend
│   └── types.ts
│
├── Dockerfile             # Single container (nginx + node)
├── supervisord.conf       # Runs nginx and backend together
├── nginx.conf             # Nginx config (serves frontend, proxies /api)
├── .env.example           # Docker volume/port configuration
├── docker-compose.yml     # Docker orchestration
├── package.json           # Root workspace config
├── claude.md              # This file (technical documentation)
└── README.md              # User-facing documentation
```

## Integration Points

### Music Assistant API
- **Base URL**: User-configured via UI (e.g., `http://192.168.1.100:8095`)
- **WebSocket URL**: `ws://<server_ip>:8095/ws`
- **Authentication**: None (local network only)
- **Key API Methods Implemented**:
  - `searchTracks(query, limit)` - search library for tracks
  - `getFavoriteArtists()` - retrieve user's favorite artists for AI context
  - `getLibraryTracks(limit)` - get all library tracks
  - `createPlaylist(name, provider)` - create new playlist
  - `addTracksToPlaylist(playlistId, trackUris)` - add tracks to playlist

### AI Service
- **Providers**: Claude API (Anthropic) and OpenAI
- **API Keys**: User-provided via UI (stored in SQLite)
- **Models**: Claude 3.5 Sonnet / GPT-4
- **Custom Endpoints**: OpenAI base URL configurable for compatible endpoints
- **Prompt Engineering**:
  - System prompt requesting structured JSON output
  - Includes user's favorite artists for better recommendations
  - Returns track list with title, artist, album

## Technology Stack (Implemented)

### Finalized Stack
1. ✅ **Frontend**: React 19.2 + Vite + TypeScript
2. ✅ **State Management**: React Context
3. ✅ **Styling**: Tailwind CSS + daisyUI
4. ✅ **Backend**: Node.js/Express with TypeScript
5. ✅ **Database**: SQLite (settings, history, presets)
6. ✅ **AI Integration**: Claude API and OpenAI API (user-configured via UI)
7. ✅ **WebSocket**: `ws` library for Music Assistant connection
8. ✅ **Error Handling**: @jfdi/attempt (try/catch banned)
9. ✅ **Code Quality**: ESLint + Prettier with strict rules
10. ✅ **Deployment**: Docker + docker-compose

### Features Implemented
- ✅ Text input for playlist prompt
- ✅ AI generates track list (structured JSON)
- ✅ Search Music Assistant library for tracks
- ✅ Fuzzy track matching (title + artist)
- ✅ Fetch user's favorite artists for AI context
- ✅ Match and create playlist
- ✅ Display results with Found/Not Found badges
- ✅ Preset prompts (workout, chill, party, focus, road trip)
- ✅ Prompt history tracking
- ✅ Settings UI (MA URL, AI provider, API keys)
- ✅ Support for OpenAI-compatible endpoints
- ✅ Track removal from preview
- ✅ Success/error notifications
- ✅ Docker deployment setup

### Deployment & Configuration
- **Docker**: Single container with nginx + Node.js using supervisor
- **Architecture**: nginx serves frontend static files and proxies `/api` to backend
- **Port**: Exposed on port 9876 (configurable via APP_PORT in .env)
- **Data Persistence**: SQLite database mounted as Docker volume (configurable via DATA_PATH in .env)
- **Configuration**: All app settings via UI (stored in SQLite)
- **Environment Variables**: Only DATA_PATH and APP_PORT for Docker setup

## Build Status

### ✅ Frontend Build: SUCCESS
```
vite v7.2.2 building client environment for production...
✓ 32 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.29 kB
dist/assets/index-*.css          19.34 kB │ gzip:  5.46 kB
dist/assets/index-*.js          213.86 kB │ gzip: 65.62 kB
✓ built in 1.15s
```

### ✅ Backend Build: SUCCESS
```
> backend@1.0.0 build
> tsc
```

### ✅ Linting: CLEAN
- Frontend: No errors
- Backend: No errors (after fixing @jfdi/attempt usage)

## Development Workflow

```bash
# Install dependencies
npm install

# Start development (both frontend and backend)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Fix auto-fixable linting issues
npm run lint -- --fix

# Docker deployment
docker-compose up --build
```

## API Endpoints

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/test/music-assistant` - Test MA WebSocket connection
- `POST /api/settings/test/anthropic` - Test Anthropic API key
- `POST /api/settings/test/openai` - Test OpenAI API key

### Playlist
- `POST /api/playlist/generate` - Generate playlist from prompt
- `POST /api/playlist/create` - Create playlist in Music Assistant
- `POST /api/playlist/refine` - Refine existing playlist suggestions

### Prompts
- `GET /api/prompts/history` - Get prompt history
- `GET /api/prompts/presets` - Get preset prompts

## Security Considerations

- ✅ API keys stored in SQLite (not committed)
- ✅ Input validation and sanitization
- ✅ CORS configuration for frontend access
- ✅ Graceful error handling with @jfdi/attempt
- ✅ No authentication needed (local network only)

## Performance

- ✅ Fast initial load
- ✅ Responsive UI during AI processing (loading spinners)
- ✅ Efficient MA WebSocket queries
- ✅ Minimal re-renders (proper React patterns)
- ✅ Production builds with tree-shaking and minification
- ✅ Gzip compression on frontend assets

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Last Updated**: 2025-11-09

## Testing Checklist

- [ ] Test Music Assistant connection
- [ ] Test Claude API playlist generation
- [ ] Test OpenAI API playlist generation
- [ ] Test with custom OpenAI endpoint
- [ ] Test track matching (exact and fuzzy)
- [ ] Test favorite artists context
- [ ] Test preset prompts
- [ ] Test prompt history
- [ ] Test playlist creation in MA
- [ ] Test track removal from preview
- [ ] Test error handling (network failures, API errors)
- [ ] Test Docker deployment
- [ ] Test settings persistence
