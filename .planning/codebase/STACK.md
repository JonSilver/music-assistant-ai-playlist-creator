# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (frontend and backend)

**Secondary:**
- JavaScript - Package scripts and configuration

## Runtime

**Environment:**
- Node.js 22 (Alpine base in Docker)

**Package Manager:**
- npm (workspace setup with Workspaces feature)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - Frontend UI framework
- Express 5.1.0 - Backend API server

**Styling:**
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- daisyUI 5.4.7 - Tailwind component library
- PostCSS 8.5.6 - CSS processing pipeline

**Build/Dev:**
- Vite 7.1.7 - Frontend build tool and dev server
- TypeScript compiler (tsc) - Backend compilation
- tsc-watch 6.3.0 - Development watch mode with auto-restart

**Linting/Formatting:**
- oxlint 1.2.0 - JavaScript/TypeScript linting (both frontend and backend)
- Prettier 3.6.2 - Code formatter (both frontend and backend)

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.68.0 - Anthropic Claude API client
- openai 6.8.1 - OpenAI API client
- better-sqlite3 12.4.1 - SQLite database for local storage (backend only)
- ws 8.18.0 - WebSocket client for Music Assistant integration
- zod 4.1.12 - Type validation library (both frontend and backend)
- @jfdi/attempt 1.3.9 - Error handling utility (replaces try/catch)

**UI Components:**
- @headlessui/react 2.2.9 - Unstyled, accessible UI components

**Development:**
- concurrently 9.1.2 - Run multiple npm scripts in parallel
- knip 5.69.0 - Unused code/export detection
- @vitejs/plugin-react 5.0.4 - React support in Vite
- @tailwindcss/vite 4.1.17 - Tailwind CSS Vite plugin
- autoprefixer 10.4.21 - PostCSS plugin for vendor prefixes
- rollup 4 - Bundler used by Vite

**Type Definitions:**
- @types/node 24.10.0 - Node.js types (root and workspace)
- @types/react 19.1.16 - React types
- @types/react-dom 19.1.9 - React DOM types
- @types/express 5.0.5 - Express types
- @types/ws 8.5.13 - WebSocket types
- @types/better-sqlite3 7.6.13 - SQLite types
- @types/cors 2.8.19 - CORS middleware types

## Configuration

**Environment:**
- Development: `.env` (local dev configuration)
- Production: Environment variables set via Docker Compose
- Configuration file: `C:\Dev\music-assistant-ai-playlist-creator\.env.example` (development template)

**Key Configuration Variables:**
- `BACKEND_PORT` - Backend API port (default 3333)
- `FRONTEND_PORT` - Frontend dev server port (default 5555)
- `VITE_BACKEND_PORT` - Frontend's connection to backend
- `PORT` / `APP_PORT` - Application port in production (default 9876)
- `DATABASE_PATH` - SQLite database location (development: `./data/playlists.db`, production: `/app/data/playlists.db`)
- `NODE_ENV` - Set to `production` in Docker runtime

**Build Configuration:**
- Frontend: `C:\Dev\music-assistant-ai-playlist-creator\frontend\vite.config.ts`
- Backend: Uses TypeScript compiler config
- Root TypeScript: `C:\Dev\music-assistant-ai-playlist-creator\backend\tsconfig.json` and `C:\Dev\music-assistant-ai-playlist-creator\frontend\tsconfig.json`

**Path Aliases:**
- Frontend: `@` → `./src/`, `@shared` → `../shared` (configured in Vite)

## Platform Requirements

**Development:**
- Node.js 22+
- npm (workspace support)
- Ports: 3333 (backend), 5555 (frontend)

**Production:**
- Docker with Docker Compose
- Port: 9876 (configurable)
- Persistent volume for SQLite database (`/app/data`)

## Deployment

**Container:**
- Base image: `node:22-alpine`
- Multi-stage build (deps → build → runtime)
- Runs as unprivileged user `node`
- Exposed port: 9876
- Entrypoint: `C:\Dev\music-assistant-ai-playlist-creator\entrypoint.sh`
- Database volume: `/app/data` (expected to be mounted externally)

**Docker Compose:**
- Image: `jonsilver/music-assistant-ai-playlist-creator:latest` (configurable)
- Restart policy: unless-stopped
- Single service (`app`)
- Port mapping: 9876 (configurable)

---

*Stack analysis: 2026-01-23*
