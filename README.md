# Music Assistant AI Playlist Creator

An AI-powered web application for creating intelligent playlists in Music Assistant. Describe your ideal playlist in natural language, and let AI select the perfect tracks from your library.

## Features

- **AI-Powered Suggestions**: Uses Claude or OpenAI to generate playlist suggestions
- **Smart Matching**: Intelligently matches AI suggestions to your Music Assistant library
- **Prompt History**: Keep track of previously used prompts
- **Preset Prompts**: Quick access to common playlist types (workout, chill, party, focus)
- **Playlist Preview**: Review and edit AI suggestions before creating the playlist
- **Iterative Refinement**: Request AI to refine the playlist based on feedback
- **Modern UI**: Built with React 19, shadcn-ui components, and Tailwind CSS

## Tech Stack

### Frontend
- React 19.2 with TypeScript (strict mode)
- Vite for build tooling
- Tailwind CSS for styling
- shadcn-ui for UI components
- React Context for state management

### Backend
- Node.js with Express
- TypeScript (strict mode)
- WebSocket client (`ws`) for Music Assistant connection
- SQLite for storing prompt history and settings
- Support for both Claude and OpenAI APIs

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

- `GET /health` - Health check
- `POST /api/playlist/create` - Create playlist from prompt
- `POST /api/playlist/refine` - Refine existing suggestions
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
- **Consistent Formatting**: Enforced via ESLint

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
- [shadcn-ui](https://ui.shadcn.com) - Re-usable components
- [Anthropic Claude](https://anthropic.com) - AI language model
- [OpenAI](https://openai.com) - AI language model
