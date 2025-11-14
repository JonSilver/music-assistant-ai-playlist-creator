# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions based on natural language descriptions
- **Smart Library Matching**: Matches AI suggestions to your Music Assistant library using intelligent search with provider weighting
- **Provider Weighting**: Prioritize specific music providers (e.g., Spotify, Tidal) when matching tracks
- **Multi-Provider Support**: Configure multiple AI providers (Claude, OpenAI, compatible endpoints) with individual settings
- **Enhanced Track Matching**: Select from multiple matching results when replacing tracks
- **Track Management**: Replace or retry individual tracks, remove tracks from preview
- **Iterative Refinement**: Refine generated playlists with additional instructions
- **Enhanced Visualization**: Match statistics, progress bars, and track filters (All/Found/Not Found)
- **Direct Playlist Links**: One-click access to created playlists in Music Assistant
- **Prompt History**: Track previously used prompts
- **Preset Prompts**: Quick access to common playlist types (workout, chill, party, focus, road trip, dinner party, study, throwback)

## Architecture

### Tech Stack

- **Frontend**: React 19.2 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + daisyUI
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with better-sqlite3
- **AI Integration**: Claude API (multiple models) and OpenAI API (multiple models)
- **Music Assistant**: WebSocket API integration
- **Error Handling**: @jfdi/attempt (tuple destructuring pattern)
- **Validation**: Zod for runtime type safety
- **Code Quality**: ESLint + Prettier with strict rules
- **Deployment**: Single Docker container with strict volume validation

### How It Works

1. User enters a natural language playlist description
2. Frontend fetches user's favorite artists from Music Assistant for context
3. AI service (Claude or OpenAI) generates structured track list
4. Frontend searches Music Assistant library for each suggested track
5. Matched tracks are displayed with Found/Not Found badges
6. User can retry individual tracks, replace tracks, refine the entire playlist, or create playlist in Music Assistant
7. After creation, a direct link to the new playlist in Music Assistant is displayed

## Prerequisites

- Docker and docker-compose
- Music Assistant server running on your local network (default port 8095)
- Claude API key or OpenAI API key

## Installation

### Production Deployment (from Docker Hub)

For production deployment on a server, pre-built images are available on Docker Hub:

```bash
# Quick start
curl -O https://raw.githubusercontent.com/JonSilver/music-assistant-ai-playlist-creator/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/JonSilver/music-assistant-ai-playlist-creator/main/.env.production.example
mv .env.production.example .env
mkdir -p data
docker-compose pull
docker-compose up -d
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide including CI/CD setup.**

### Local Development with Docker

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` to customize:
   ```bash
   DATA_PATH=./data     # Where to store the database
   APP_PORT=9876        # Port to access the web UI
   ```

3. Build and start the container:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. Open http://localhost:9876 in your browser

5. Go to Settings and configure:
   - Music Assistant URL (e.g., `http://192.168.1.100:8095`)
   - Add one or more AI providers (Claude, OpenAI, or compatible endpoints)
   - For each provider: name, API key, model selection, optional base URL and temperature
   - Optionally configure provider weights (prioritize specific music sources like Spotify, Tidal, etc.)
   - Test the connections to verify
   - Optionally customize system prompt

### Development Setup (Local)

```bash
git clone <repo-url>
cd music-assistant-ai-playlist-creator
cp .env.example .env  # Optional: customize dev ports in .env
npm install
npm run dev
```

Default dev ports (configurable in `.env`):
- Frontend: http://localhost:5555 (set `FRONTEND_PORT`)
- Backend: http://localhost:3333 (set `BACKEND_PORT` and `VITE_BACKEND_PORT`)

## Usage

1. Enter a playlist description (e.g., "Upbeat 80s rock for a road trip") or select a preset prompt
2. Optionally enter a custom playlist name
3. Click "Generate Playlist"
4. Review the AI-suggested tracks
5. Use filters to view All/Found/Not Found tracks
6. For individual tracks:
   - Click "Retry" to search again
   - Click "Replace" to get AI substitutes and select from multiple matching results
   - Remove unwanted tracks manually
7. Click "Refine Playlist" for batch adjustments with AI
8. Click "Create Playlist in Music Assistant"
9. Click the provided link to view your new playlist in Music Assistant

## API Endpoints

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings

### Prompts
- `GET /api/prompts/history` - Get prompt history
- `GET /api/prompts/presets` - Get preset prompts

**Note**: All AI and Music Assistant operations are handled directly in the frontend via their respective APIs/WebSockets. The backend only manages settings and prompt storage.

## Configuration

### Environment Variables (.env)

**Docker/Production:**
- `DATA_PATH` - Directory for SQLite database (default: `./data`)
- `APP_PORT` - Port to expose the application (default: `9876`)

**Development:**
- `BACKEND_PORT` - Backend API server port (default: `3333`)
- `FRONTEND_PORT` - Frontend dev server port (default: `5555`)
- `VITE_BACKEND_PORT` - Backend port for frontend API calls (default: `3333`, must match `BACKEND_PORT`)

### Application Settings (via UI)

All application settings are configured through the web interface and stored in SQLite:

- **Music Assistant URL**: WebSocket endpoint for your Music Assistant instance
- **AI Providers**: Add multiple providers with individual configuration:
  - Name (e.g., "Claude Sonnet", "OpenAI GPT-4")
  - Type (Anthropic or OpenAI-compatible)
  - API Key
  - Model selection (dropdown of available models)
  - Base URL (for OpenAI-compatible endpoints)
  - Temperature (0-2, optional per-provider setting)
- **Provider Weights**: Ordered list of keywords to prioritize music providers (e.g., "spotify", "tidal")
- **System Prompt**: Custom instructions for the AI (preview default prompt in UI)

## Data Storage

The SQLite database is stored in the directory specified by `DATA_PATH` (defaults to `./data`). This contains:
- Application settings (Music Assistant URL, AI providers, provider weights, system prompt)
- Prompt history
- Preset prompts

To use a different location, edit `DATA_PATH` in your `.env` file.

## Project Structure

```
/
├── frontend/                      # React application
│   ├── src/
│   │   ├── contexts/             # React Context providers
│   │   ├── services/             # API clients
│   │   ├── App.tsx               # Main application
│   │   └── main.tsx              # Entry point
│   └── package.json
│
├── backend/                      # Express API server
│   ├── src/
│   │   ├── routes/              # Express routes
│   │   ├── services/            # AI and Music Assistant services
│   │   ├── db/                  # SQLite database
│   │   └── server.ts            # Express app
│   └── package.json
│
├── shared/                       # Shared TypeScript types
│   └── types.ts
│
├── .github/
│   └── workflows/
│       └── docker-publish.yml   # CI/CD pipeline for Docker Hub
│
├── Dockerfile                   # Production container build
├── docker-compose.yml           # Production deployment (Docker Hub)
├── docker-compose.dev.yml       # Development deployment (local build)
├── entrypoint.sh                # Docker startup validation
├── DEPLOYMENT.md                # Deployment and CI/CD guide
└── .env.production.example      # Production environment template
```

## Build Commands

```bash
# Development (runs both frontend and backend with hot reload)
npm run dev

# Development build
npm run build

# Production build (bumps version)
npm run build:prod

# Lint and auto-fix
npm run lint --fix

# Docker - Development (local build)
docker-compose -f docker-compose.dev.yml up --build

# Docker - Production (from Docker Hub)
docker-compose pull && docker-compose up -d
```

## Music Assistant Integration

This application connects to Music Assistant via WebSocket to:
- Search your music library for tracks
- Retrieve your favorite artists (used as context for AI)
- Create playlists
- Add tracks to playlists

**Note**: No authentication is required as Music Assistant is designed for local network use.

## AI Integration

### Multi-Provider Support

Configure one or more AI providers, each with individual settings:

1. **Anthropic (Claude)**
   - Models: Claude 3.5 Sonnet, Claude 3.7 Sonnet, Claude Opus 4, and more
   - Requires: Anthropic API key

2. **OpenAI**
   - Models: GPT-4, GPT-4 Turbo, GPT-4o, GPT-4o Mini, and more
   - Requires: OpenAI API key

3. **OpenAI-Compatible Endpoints**
   - Any service with OpenAI-compatible API (e.g., local LLMs, third-party services)
   - Requires: Custom base URL and API key
   - Model selection via dropdown

### How AI Generates Playlists

The AI receives:
- Your natural language prompt
- Your favorite artists from Music Assistant (for better recommendations)
- Custom system prompt (if configured)

The AI returns a structured JSON list of tracks with:
- Track title
- Artist name
- Album name (optional)

### Provider Weighting

Configure an ordered list of provider keywords (e.g., "spotify", "tidal", "local") to prioritize specific music sources when matching tracks. Higher-weighted providers are preferred when multiple matches are found.

## Updating

### Production Deployment
```bash
docker-compose pull    # Pull latest image from Docker Hub
docker-compose up -d   # Restart with new image
```

### Local Development
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for version management and release procedures.

## Troubleshooting

### Connection Issues

- Use the "Test Connection" buttons in Settings to verify connectivity
- Ensure Music Assistant is running and accessible on your network
- Check that your AI API key is valid

### No Tracks Found

- Verify your Music Assistant library contains the suggested tracks
- Try refining your prompt to be more specific to your library
- Check that favorite artists are set in Music Assistant for better context
- Adjust provider weights to prioritize specific music sources
- Use the "Replace" feature to get alternative suggestions from AI

## License

ISC

## Acknowledgments

- [Music Assistant](https://music-assistant.io)
- [daisyUI](https://daisyui.com)
- [Anthropic Claude](https://anthropic.com)
- [OpenAI](https://openai.com)
- [@jfdi/attempt](https://github.com/jfdi-dev/iffyjs)
