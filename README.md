# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

### Current Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions based on natural language descriptions
- **Smart Library Matching**: Intelligently matches AI suggestions to your Music Assistant library across multiple streaming services (Spotify, Apple Music, etc.)
- **Iterative Refinement**: Refine generated playlists with additional instructions (e.g., "add more upbeat tracks", "remove slow songs")
- **Enhanced Visualization**:
  - Match statistics showing success rate
  - Progress bar for match percentage
  - Filter tracks by All/Found/Not Found
  - Color-coded badges with icons
  - Shows which music provider matched each track
- **Customizable AI Behavior**:
  - Adjustable temperature (0-2) for creativity control
  - Custom system prompts to change AI curation style
  - Choice between Claude and OpenAI
- **Prompt History**: Keep track of previously used prompts and reuse them
- **Preset Prompts**: Quick access to common playlist types (workout, chill, party, focus)
- **Track Management**:
  - Review generated tracks before creating playlist
  - Remove unwanted tracks individually
  - See which tracks matched vs. not found
- **Modern UI**: Built with React 19, daisyUI components, and Tailwind CSS

## Tech Stack

### Frontend
- React 19.2 with TypeScript (strict mode)
- Vite for build tooling
- Tailwind CSS for styling
- daisyUI for UI components
- React Context for state management
- @jfdi/attempt for error handling

### Backend
- Node.js with Express
- TypeScript (strict mode)
- WebSocket client (`ws`) for Music Assistant connection
- SQLite (better-sqlite3) for storing settings, prompt history, and presets
- @jfdi/attempt for error handling (no try/catch)
- Support for both Claude (Anthropic) and OpenAI APIs

## Prerequisites

- Docker and docker-compose
- Music Assistant server running on your local network
- Claude API key or OpenAI API key

## Installation

See the **Docker Deployment** section below for production deployment.

For development setup, see the **Development** section.

## Docker Deployment

### Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to customize your setup (optional):
   ```bash
   # Data directory on host machine for SQLite database
   DATA_PATH=./data

   # Port to expose the application on
   APP_PORT=9876
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

The application will be available at http://localhost:9876 (or the port you configured).

### Data Persistence

The SQLite database is stored in the directory specified by `DATA_PATH` in your `.env` file (defaults to `./data`). This directory is created automatically and contains:
- `playlists.db` - SQLite database with settings, prompt history, and presets

To use a different data directory, simply change `DATA_PATH` in your `.env` file:

```bash
DATA_PATH=/mnt/storage/playlist-creator
```

### Configuration

All application settings are configured through the web UI. Navigate to Settings and configure:
- Music Assistant URL (e.g., `http://192.168.1.100:8095`)
- AI Provider (Claude or OpenAI)
- API keys
- Temperature and custom system prompts

### Rebuilding

After pulling updates:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Development

For local development without Docker:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run in development mode**
   ```bash
   npm run dev
   ```

   Or run frontend and backend separately:
   ```bash
   # Frontend (http://localhost:5173)
   npm run dev:frontend

   # Backend (http://localhost:3001)
   npm run dev:backend
   ```

3. **Configure via web UI**
   - Open http://localhost:5173
   - Go to Settings
   - Configure Music Assistant URL, AI provider, and API keys

## Project Structure

```
/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API clients
│   │   ├── types/      # TypeScript types
│   │   ├── lib/        # Utilities & configs
│   │   └── App.tsx     # Main app component
│   └── package.json
│
├── backend/            # Express API server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   │   ├── ai.ts   # AI integration
│   │   │   └── musicAssistant.ts # MA client
│   │   ├── db/         # Database layer
│   │   ├── types/      # TypeScript types
│   │   └── server.ts   # Express app
│   └── package.json
│
├── shared/             # Shared types
│   └── types.ts
│
├── .env.example        # Environment template
└── package.json        # Root workspace
```

## Usage

1. Start the application (see Docker Deployment or Development sections)
2. Open the web UI (http://localhost:9876 for Docker, http://localhost:5173 for dev)
3. Go to Settings and configure:
   - Music Assistant URL
   - AI provider and API key
4. Enter a playlist description (e.g., "Upbeat 80s rock for a road trip")
5. Review the AI-suggested tracks
6. Remove unwanted tracks or request refinements
7. Create the playlist in Music Assistant

## API Endpoints

### Backend API

- `GET /api/health` - Health check
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update application settings
- `POST /api/settings/test/music-assistant` - Test Music Assistant connection
- `POST /api/settings/test/anthropic` - Test Anthropic API key
- `POST /api/settings/test/openai` - Test OpenAI API key
- `POST /api/playlist/generate` - Generate playlist suggestions from prompt
- `POST /api/playlist/create` - Create playlist in Music Assistant
- `POST /api/playlist/refine` - Refine existing playlist suggestions
- `GET /api/prompts/history` - Get prompt history
- `GET /api/prompts/presets` - Get preset prompts

## Environment Variables

For Docker deployment only (configured in `.env` file):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATA_PATH` | Host directory for SQLite database | `./data` |
| `APP_PORT` | Port to expose the application on | `9876` |

All application settings (Music Assistant URL, AI provider, API keys) are configured through the web UI and stored in the SQLite database.

## Code Quality

This project maintains high code quality standards:

- **Strict TypeScript**: No `any` types, full type safety
- **No React Anti-patterns**: Follows React 19 best practices
- **Well-tested Libraries**: Uses battle-hardened, well-maintained packages
- **Consistent Formatting**: Enforced via ESLint and Prettier
- **Error Handling**: Consistent use of @jfdi/attempt (no try/catch)

## Roadmap / Potential Features

- **Manual Track Addition**: Search Music Assistant library and manually add tracks to the playlist
- **Track Duration**: Show track length in the track list
- **Drag & Drop Reordering**: Reorder tracks before creating playlist

## Contributing

Contributions are welcome! Please ensure:

1. TypeScript strict mode compliance
2. No ESLint errors
3. Follow existing code patterns
4. Add types for all new code

## License

ISC

## Acknowledgments

- [Music Assistant](https://music-assistant.io) - Open-source music library manager
- [daisyUI](https://daisyui.com) - Tailwind CSS component library
- [Anthropic Claude](https://anthropic.com) - AI language model
- [OpenAI](https://openai.com) - AI language model
- [@jfdi/attempt](https://github.com/jfdi-dev/iffyjs) - Type-safe error handling
