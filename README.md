# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions based on natural language descriptions
- **Smart Library Matching**: Matches AI suggestions to your Music Assistant library using search
- **Iterative Refinement**: Refine generated playlists with additional instructions
- **Enhanced Visualization**: Match statistics, progress bars, and track filters
- **Connection Testing**: Test Music Assistant and AI API connections before saving settings
- **Customizable AI**: Adjust temperature, custom system prompts, and model selection
- **Model Selection**: Choose from any available Claude or OpenAI model
- **Track Management**: Replace or retry individual tracks, remove tracks from preview
- **Prompt History**: Track previously used prompts
- **Preset Prompts**: Quick access to common playlist types (workout, chill, party, focus, road trip, etc.)

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

### Using Docker (Recommended)

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` to customize:
   ```bash
   DATA_PATH=./data     # Where to store the database
   APP_PORT=9876        # Port to access the web UI
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

4. Open http://localhost:9876 in your browser

5. Go to Settings and configure:
   - Music Assistant URL (e.g., `http://192.168.1.100:8095`)
   - AI Provider (Claude or OpenAI)
   - AI Model (select from available models)
   - API Key
   - Test the connections to verify
   - Optionally customize temperature and system prompt

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
6. For individual tracks: click "Retry" to search again or "Replace" to get an AI substitute
7. Remove unwanted tracks or click "Refine Playlist" for batch adjustments
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
- **AI Provider**: Choose between Claude (Anthropic) or OpenAI
- **AI Model**: Select from available models for the selected provider
- **API Keys**: Anthropic API key and/or OpenAI API key
- **OpenAI Base URL**: Optional custom endpoint for OpenAI-compatible services
- **Temperature**: AI creativity level (0-2, default: 0.7)
- **System Prompt**: Custom instructions for the AI (preview default prompt in UI)

## Data Storage

The SQLite database is stored in the directory specified by `DATA_PATH` (defaults to `./data`). This contains:
- Application settings
- Prompt history
- Preset prompts

To use a different location, edit `DATA_PATH` in your `.env` file.

## Project Structure

```
/
├── frontend/               # React application
│   ├── src/
│   │   ├── contexts/      # React Context providers
│   │   ├── services/      # API clients
│   │   ├── App.tsx        # Main application
│   │   └── main.tsx       # Entry point
│   └── package.json
│
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/       # Express routes
│   │   ├── services/     # AI and Music Assistant services
│   │   ├── db/           # SQLite database
│   │   └── server.ts     # Express app
│   └── package.json
│
├── shared/               # Shared TypeScript types
│   └── types.ts
│
├── Dockerfile            # Single container build
├── docker-compose.yml    # Docker orchestration
├── nginx.conf            # Nginx configuration
└── supervisord.conf      # Process manager
```

## Build Commands

```bash
# Run development servers
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Build Docker image
docker-compose up --build
```

## Music Assistant Integration

This application connects to Music Assistant via WebSocket to:
- Search your music library for tracks
- Retrieve your favorite artists (used as context for AI)
- Create playlists
- Add tracks to playlists

**Note**: No authentication is required as Music Assistant is designed for local network use.

## AI Integration

### Supported Providers

1. **Claude (Anthropic)**
   - Select from available Claude models via dropdown
   - Requires: Anthropic API key

2. **OpenAI**
   - Select from available OpenAI models via dropdown
   - Requires: OpenAI API key
   - Supports custom base URLs for compatible endpoints

### How AI Generates Playlists

The AI receives:
- Your natural language prompt
- Your favorite artists from Music Assistant (for context)
- Custom system prompt (if configured)

The AI returns a structured JSON list of tracks with:
- Track title
- Artist name
- Album name (optional)

## Updating

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Connection Issues

- Use the "Test Connection" buttons in Settings to verify connectivity
- Ensure Music Assistant is running and accessible on your network
- Check that your AI API key is valid

### No Tracks Found

- Verify your Music Assistant library contains the suggested tracks
- Try refining your prompt to be more specific to your library
- Check that favorite artists are set in Music Assistant for better context

## Planned Features

- Investigate possible Spotify integration
- A proper logo and icon
- Clear Query button to reset prompt

## License

ISC

## Acknowledgments

- [Music Assistant](https://music-assistant.io)
- [daisyUI](https://daisyui.com)
- [Anthropic Claude](https://anthropic.com)
- [OpenAI](https://openai.com)
- [@jfdi/attempt](https://github.com/jfdi-dev/iffyjs)
