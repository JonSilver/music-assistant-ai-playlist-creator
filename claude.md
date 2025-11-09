# Music Assistant AI Playlist Creator

## Project Overview

This project provides an AI-assisted playlist creation interface for Music Assistant. Users describe their desired playlist in natural language, and the AI generates a curated playlist by selecting tracks from their existing Music Assistant library.

## Architecture

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **State Management**: React Context
- **Styling**: Tailwind CSS
- **API Communication**: Native fetch API

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript (strict mode)
- **Database**: SQLite (for storing prompts, history, settings if needed)
- **AI Integration**: Claude API and OpenAI API (user selects via config)
- **Music Assistant Integration**: WebSocket API using `ws` library
- **WebSocket Library**: `ws` for MA connection

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
Frontend (React)
    ↓
Backend API Server
    ↓
AI Service (Claude/OpenAI)
    ↓
AI Returns Structured Track List
    ↓
Backend Searches MA Library via WebSocket
    ↓
Match Tracks & Create Playlist via MA API
    ↓
Response to Frontend (with match results)
```

## Core Features

### 1. Playlist Prompt Interface
- Text input for natural language playlist description
- Example prompts/suggestions
- Prompt history/favorites (optional)

### 2. AI Processing
- Send user prompt to AI service
- Request structured response with:
  - Track titles
  - Artists
  - Optional: genre, mood, era filters
  - Confidence scores (optional)

### 3. Music Assistant Integration
- Connect to MA instance via WebSocket (user provides server URL)
- Use `music_assistant.search` for global search across library
- Use `music_assistant.get_library` for local library queries
- Search by track name, artist, and album
- Create playlist via `createPlaylist()` API method
- Add matched tracks via `addPlaylistTracks()`
- Handle partial matches and missing tracks gracefully

### 4. Results Display
- Show matched tracks
- Highlight unmatched suggestions
- Allow manual selection/deselection
- Preview playlist before creation

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if necessary)
- Proper type definitions for all props, state, and API responses
- Use discriminated unions for complex state
- Leverage type inference where appropriate

### React Best Practices
- Functional components only
- Custom hooks for business logic
- Proper dependency arrays in hooks
- Avoid prop drilling (use composition or context)
- Memoization only when necessary (avoid premature optimization)
- Use React 19 features:
  - Server Components (if applicable)
  - Actions
  - `use` hook
  - Improved `useTransition`

### Anti-patterns to Avoid
- ❌ Mutating state directly
- ❌ Using index as key in lists
- ❌ Storing derived state
- ❌ Unnecessary useEffect
- ❌ Prop drilling
- ❌ Inline object/function definitions in JSX (when causing re-renders)
- ❌ Missing cleanup in effects
- ❌ Uncontrolled/controlled component mixing

### Testing
- Unit tests for utilities and hooks
- Integration tests for critical flows
- Component testing with React Testing Library
- E2E tests for main user journeys (optional)

## Project Structure (Proposed)

```
/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Reusable UI components
│   │   │   └── features/ # Feature-specific components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API clients
│   │   │   └── api.ts   # Backend API client
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   ├── lib/          # Third-party configs
│   │   └── App.tsx       # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── routes/        # Express routes
│   │   │   ├── playlist.ts # Playlist creation endpoints
│   │   │   └── health.ts  # Health check
│   │   ├── services/
│   │   │   ├── ai.ts     # AI service integration
│   │   │   └── musicAssistant.ts # MA WebSocket client
│   │   ├── db/           # SQLite database
│   │   │   └── schema.ts # DB schema & migrations
│   │   ├── types/        # Shared TypeScript types
│   │   ├── utils/        # Utilities
│   │   └── server.ts     # Express app setup
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # Shared types between frontend/backend
│   └── types.ts
│
├── .env.example           # Environment variables template
├── docker-compose.yml     # Docker setup (optional)
├── package.json           # Root workspace config
└── README.md
```

## Integration Points

### Music Assistant API
- **Base URL**: User-configured (e.g., `http://192.168.1.100:8095`)
- **WebSocket URL**: `ws://<server_ip>:8095/ws`
- **Authentication**: None (local network only)
- **API Documentation**: Available at `http://<server_ip>:8095/api-docs`
- **Key API Methods**:
  - `getLibraryTracks()` - retrieve all library tracks with filters/sorting
  - `getLibraryArtists()` - get artists from library
  - `getLibraryAlbums()` - get albums from library
  - `getLibraryPlaylists()` - retrieve existing playlists
  - `search()` - global search on library and providers (supports: artist, album, track, playlist, radio)
  - `createPlaylist(name, provider)` - create new playlist
  - `addPlaylistTracks(playlistId, uris)` - add tracks to playlist
  - `getPlaylistTracks(playlistId)` - retrieve playlist contents

**Search Parameters**:
- `name`: search query string
- `media_type`: artist, album, track, radio, or playlist
- `limit`: max results per type
- `library_only`: restrict to library items only

### AI Service
- **Provider**: Claude API or OpenAI (user's choice)
- **API Key**: User-provided via environment variable
- **Model**: Claude 3.5 Sonnet or GPT-4
- **Prompt Engineering**: System prompt requesting structured JSON output
- **Response Format**: JSON array with objects containing:
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

## Technology Stack (Finalized)

### Decided Stack
1. ✅ **Frontend**: React 19.2 + Vite + TypeScript
2. ✅ **State Management**: React Context
3. ✅ **Styling**: Tailwind CSS
4. ✅ **Backend**: Node.js/Express with TypeScript
5. ✅ **Database**: SQLite (for optional features like history, settings)
6. ✅ **AI Integration**: Both Claude API and OpenAI API (user-configured)
7. ✅ **WebSocket**: `ws` library for Music Assistant connection
8. ✅ **Development Approach**: Start with MVP, iterate with enhancements

### MVP Feature Set
- Text input for playlist prompt
- AI generates track list (structured JSON)
- Search Music Assistant library for tracks
- Match and create playlist
- Display results with match status

### Deployment & Configuration
5. **Deployment Target**:
   - Docker container (recommended for easy setup)
   - Self-hosted Node/Python server
   - Could run on same device as Music Assistant

6. **Environment Configuration**:
   - `.env` file with:
     - `MUSIC_ASSISTANT_URL` (e.g., `http://192.168.1.100:8095`)
     - `AI_API_KEY` (Claude or OpenAI)
     - `AI_PROVIDER` (claude or openai)
     - `PORT` (default 3000)

### Implementation Details
7. **Track Matching Strategy**:
   - Exact match first
   - Fuzzy match if needed (Levenshtein distance?)
   - Allow user to resolve ambiguous matches?

8. **Error Handling**:
   - Retry logic for network failures
   - Partial playlist creation if some tracks not found
   - Show clear feedback on unmatched tracks

9. **AI Prompt Design**:
   - Include user's music library context in prompt?
   - Request multiple alternatives per track?
   - Specify playlist length in prompt?

### Nice to Have Features
10. **Playlist Refinement**: Allow editing before creation?
11. **Prompt Templates**: Common playlist types (workout, chill, etc.)?
12. **History**: Save past prompts and generated playlists?
13. **Export**: Export playlist as M3U, Spotify format, etc.?

## Development Workflow

1. **Setup**: Install dependencies, configure environment
2. **Development**: Hot reload, TypeScript checking, linting
3. **Testing**: Run tests before commits
4. **Building**: Production build optimization
5. **Deployment**: TBD based on target platform

## Getting Started (To Be Completed)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API keys and MA connection details

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Documentation Standards

- JSDoc comments for public APIs
- README with setup instructions
- Architecture decision records for major choices
- API documentation for backend endpoints

## Security Considerations

- Secure API key storage (environment variables, never committed)
- Input validation and sanitization
- Rate limiting for AI API calls
- CORS configuration
- Authentication for backend (if multi-user)

## Performance Goals

- Fast initial load (<2s)
- Responsive UI during AI processing
- Efficient MA API queries
- Minimal re-renders
- Progressive enhancement

---

**Status**: Implementation phase - Project setup
**Last Updated**: 2025-11-09

## Next Steps
1. Initialize frontend with Vite + React 19.2 + TypeScript
2. Initialize backend with Express + TypeScript
3. Set up Tailwind CSS
4. Create shared types
5. Set up environment configuration
6. Implement MVP features
