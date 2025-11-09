# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions based on natural language descriptions
- **Smart Library Matching**: Matches AI suggestions to your Music Assistant library using search
- **Iterative Refinement**: Refine generated playlists with additional instructions
- **Enhanced Visualization**: Match statistics, progress bars, and track filters
- **Connection Testing**: Test Music Assistant and AI API connections before saving settings
- **Customizable AI**: Adjust temperature and custom system prompts
- **Prompt History**: Track previously used prompts
- **Preset Prompts**: Quick access to common playlist types

## Architecture

### Tech Stack

- **Frontend**: React 19.2 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + daisyUI
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **AI Integration**: Claude API and OpenAI API
- **Music Assistant**: WebSocket API integration
- **Error Handling**: @jfdi/attempt (tuple destructuring pattern)
- **Deployment**: Single Docker container with nginx + Node.js

### How It Works

1. User enters a natural language playlist description
2. Backend fetches user's favorite artists from Music Assistant for context
3. AI service (Claude or OpenAI) generates structured track list
4. Backend searches Music Assistant library for each suggested track
5. Matched tracks are displayed with Found/Not Found badges
6. User can refine suggestions or create playlist in Music Assistant

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
   - API Key
   - Test the connections to verify

### Development Setup (Local)

```bash
git clone <repo-url>
cd music-assistant-ai-playlist-creator
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## Usage

1. Enter a playlist description (e.g., "Upbeat 80s rock for a road trip")
2. Click "Generate Playlist"
3. Review the AI-suggested tracks
4. Use filters to view All/Found/Not Found tracks
5. Remove unwanted tracks or click "Refine Playlist" for adjustments
6. Click "Create Playlist in Music Assistant"

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

## Configuration

### Environment Variables (.env)

- `DATA_PATH` - Directory for SQLite database (default: `./data`)
- `APP_PORT` - Port to expose the application (default: `9876`)

### Application Settings (via UI)

All application settings are configured through the web interface and stored in SQLite:

- **Music Assistant URL**: WebSocket endpoint for your Music Assistant instance
- **AI Provider**: Choose between Claude (Anthropic) or OpenAI
- **API Keys**: Anthropic API key and/or OpenAI API key
- **OpenAI Base URL**: Optional custom endpoint for OpenAI-compatible services
- **Temperature**: AI creativity level (0-2, default: 0.7)
- **System Prompt**: Custom instructions for the AI

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
   - Model: Claude 3.5 Sonnet
   - Requires: Anthropic API key

2. **OpenAI**
   - Model: GPT-4
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

## License

ISC

## Acknowledgments

- [Music Assistant](https://music-assistant.io)
- [daisyUI](https://daisyui.com)
- [Anthropic Claude](https://anthropic.com)
- [OpenAI](https://openai.com)
- [@jfdi/attempt](https://github.com/jfdi-dev/iffyjs)
