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

- Node.js 18+ and npm
- Music Assistant server running on your local network
- Claude API key or OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd music-assistant-ai-playlist-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `MUSIC_ASSISTANT_URL`: Your Music Assistant server URL (e.g., `http://192.168.1.100:8095`)
   - `AI_PROVIDER`: Choose `claude` or `openai`
   - `ANTHROPIC_API_KEY`: Your Claude API key (if using Claude)
   - `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)
   - `PORT`: Backend server port (default: 3001)

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend only (runs on http://localhost:5173)
npm run dev:frontend

# Backend only (runs on http://localhost:3001)
npm run dev:backend
```

## Building for Production

```bash
npm run build
```

This builds both the frontend and backend for production.

## Docker Deployment

### Quick Start

```bash
docker-compose up -d
```

The application will be available at http://localhost

### Data Persistence

The SQLite database is stored in a volume mapped to `./data` in your current directory. This directory is created automatically and contains:
- `playlists.db` - SQLite database with settings, prompt history, and presets

To use a different data directory, edit the `volumes` section in `docker-compose.yml`:

```yaml
volumes:
  - /your/custom/path:/app/data
```

### Configuration

All settings are configured through the web UI. Navigate to Settings and configure:
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

1. Start the application with `npm run dev`
2. Open http://localhost:5173 in your browser
3. Enter a description of your desired playlist (e.g., "Upbeat 80s rock for a road trip")
4. Review the AI-suggested tracks
5. Remove any unwanted tracks or request refinements
6. Create the playlist in Music Assistant

## API Endpoints

### Backend API

- `GET /api/health` - Health check
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update application settings
- `POST /api/playlist/generate` - Generate playlist suggestions from prompt
- `POST /api/playlist/create` - Create playlist in Music Assistant
- `POST /api/playlist/refine` - Refine existing playlist suggestions
- `GET /api/prompts/history` - Get prompt history
- `GET /api/prompts/presets` - Get preset prompts

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MUSIC_ASSISTANT_URL` | Music Assistant server URL | Yes | - |
| `AI_PROVIDER` | AI provider (`claude` or `openai`) | Yes | `claude` |
| `ANTHROPIC_API_KEY` | Claude API key | If using Claude | - |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI | - |
| `PORT` | Backend server port | No | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:5173` |
| `DATABASE_PATH` | SQLite database path | No | `./data/playlists.db` |

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
