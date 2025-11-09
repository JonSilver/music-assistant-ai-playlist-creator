# Music Assistant AI Playlist Creator

## Project Overview

This project provides an AI-assisted playlist creation interface for Music Assistant. Users describe their desired playlist in natural language, and the AI generates a curated playlist by selecting tracks from their existing Music Assistant library.

## Architecture

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **State Management**: TBD (React Context, Zustand, or Redux Toolkit)
- **Styling**: TBD (Tailwind CSS, CSS Modules, or styled-components)
- **API Communication**: TBD (fetch, axios, or React Query)

### Backend
- **Runtime**: TBD (Node.js/Express, Python/FastAPI, or other)
- **Language**: TypeScript or Python
- **AI Integration**: TBD (Claude API, OpenAI, or other)
- **Music Assistant Integration**: REST API

### Architecture Flow
```
User Input (Prompt)
    ↓
Frontend (React)
    ↓
Backend API
    ↓
AI Service (Playlist Generation)
    ↓
Music Assistant API (Track Search & Playlist Creation)
    ↓
Response to Frontend
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
- Connect to existing Music Assistant instance
- Search library for AI-suggested tracks
- Match tracks with fuzzy search if needed
- Create playlist via MA API
- Handle partial matches and missing tracks

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
src/
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── services/         # API clients and external services
│   ├── ai/          # AI service integration
│   └── musicAssistant/ # Music Assistant API client
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── lib/              # Third-party library configurations
└── App.tsx           # Main application component
```

## Integration Points

### Music Assistant API
- **Base URL**: TBD
- **Authentication**: TBD (API key, OAuth, or none)
- **Key Endpoints**:
  - Search tracks
  - Create playlist
  - Add tracks to playlist
  - Get library metadata

### AI Service
- **Provider**: TBD (Claude API preferred, OpenAI alternative)
- **Model**: TBD
- **Prompt Engineering**: System prompt to ensure structured output
- **Response Format**: JSON with track list

## Open Questions

### Critical
1. **Backend Stack**: Node.js/Express, Python/FastAPI, or serverless functions?
2. **AI Service**: Claude API (preferred?) or OpenAI? API keys management?
3. **Music Assistant Connection**:
   - How to connect to MA instance? (URL configuration, discovery?)
   - Authentication method?
   - API documentation location?
4. **Deployment Target**: Self-hosted, Docker, cloud platform?

### Important
5. **State Management**: Simple Context, Zustand, or Redux Toolkit?
6. **Styling Solution**: Preference for Tailwind, CSS Modules, or styled-components?
7. **Environment Variables**: How should users configure API keys and MA connection?
8. **Error Handling**: Retry logic, fallbacks for partial matches?

### Nice to Have
9. **Multi-user Support**: Single user or multi-user with profiles?
10. **Playlist Refinement**: Allow iterative refinement of AI suggestions?
11. **Analytics**: Track usage, popular prompts, success rates?
12. **Export**: Save prompts, export playlists to other formats?

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

**Status**: Initial planning phase
**Last Updated**: 2025-11-09
