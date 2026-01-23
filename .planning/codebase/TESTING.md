# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Status:** No testing framework currently configured or used

**Current state:**
- Zero test files in `backend/src` or `frontend/src`
- No test dependencies installed (Jest, Vitest, etc.)
- No test scripts in package.json
- No test configuration files (jest.config.ts, vitest.config.ts, etc.)

**Implications:**
- All testing is manual
- No automated test coverage
- Testing would need to be added as a new initiative

## What Should Be Tested (Future Implementation Guide)

When implementing tests, prioritize these high-risk areas:

### Backend Services (Critical)

**`backend/src/services/trackMatching.ts`** - Track matching with retry logic
- Unit: `matchTrack()` - Test all 3 retry attempts, timeout handling, provider sorting
- Unit: `matchTracksProgressively()` - Batch processing, progress callbacks
- Integration: Test with actual Music Assistant WebSocket responses
- Edge cases: Empty results on attempt 1, eventual success on attempt 2, all 3 attempts fail

**`backend/src/services/ai.ts`** - AI response parsing and generation
- Unit: `parseAIResponse()` - JSON parsing with various formats (markdown blocks, plain JSON, malformed)
- Unit: `buildSystemPrompt()` - Custom prompts, favorite artists inclusion, track count guidelines
- Integration: Claude API responses, OpenAI responses, fallback endpoints
- Mocking: Mock Anthropic and OpenAI SDKs

**`backend/src/services/playlistGenerator.ts`** - Main generation pipeline
- Integration: Full workflow - AI generation → track matching → playlist creation
- Error scenarios: Music Assistant connection failure, AI provider failure mid-stream
- Job state tracking: Verify status updates flow correctly through jobStore

**`backend/src/middleware/validation.ts`** - Request validation
- Unit: `validateRequest()` with valid/invalid payloads
- Test each API endpoint schema (GeneratePlaylistRequestSchema, etc.)
- Verify error responses include helpful details

**`backend/src/db/schema.ts`** - Database operations
- Unit: Settings CRUD operations
- Unit: Prompt history insertion and retrieval
- Unit: Preset prompts initialization
- Integration: SQLite database lifecycle (create, insert, update, query)

### Frontend Hooks & Services (High Priority)

**`frontend/src/hooks/usePlaylist.ts`** - Main playlist generation hook
- Unit: Playlist state management (prompt, playlistName, trackCount, etc.)
- Unit: Track filtering logic ("all" / "matched" / "unmatched")
- Integration: Calls to backend API (generatePlaylist, createPlaylist, refinePlaylist)
- Mocking: Mock `playlistApi` module, mock `useApp()` context

**`frontend/src/services/playlistApi.ts`** - Backend API client
- Unit: `generatePlaylistViaBackend()` - SSE event handling, progress updates
- Unit: `createPlaylistViaBackend()` - POST request construction
- Unit: `refinePlaylistViaBackend()` - Refinement request handling
- Mocking: Mock EventSource, mock fetch/backendFetch

**`frontend/src/services/api.ts`** - Settings API client
- Unit: `getSettings()`, `updateSettings()`
- Unit: `getPromptHistory()`, `getPresetPrompts()`
- Mocking: Mock `backendFetch()`

### Frontend Components (Medium Priority)

**`frontend/src/components/PlaylistCreatorForm.tsx`**
- Snapshot tests: Form structure with various provider counts
- Interaction: Input changes, form submissions
- Prop combinations: Single provider vs multiple providers

**`frontend/src/components/GeneratedTracksDisplay.tsx`**
- Rendering: Empty state, loaded tracks, filtered tracks
- Interaction: Track filtering, selection, removal
- State: Update when tracks prop changes

**`frontend/src/contexts/AppContext.tsx`**
- Unit: Settings loading, provider selection
- Unit: Provider persistence in localStorage
- Mocking: Mock `api.getSettings()`

## Recommended Testing Strategy

### Framework Choice
Given the stack (React 19, Express, TypeScript), recommend:
- **Backend:** Vitest (fast, ESM-native, minimal config)
- **Frontend:** Vitest + React Testing Library (maintain consistency)
- Both use TypeScript without extra config

### Test File Organization
- Co-locate tests with source code
- Naming convention: `fileName.test.ts` or `fileName.spec.ts`
- Directory structure mirrors source:
```
backend/src/
  services/
    trackMatching.ts
    trackMatching.test.ts
  middleware/
    validation.ts
    validation.test.ts

frontend/src/
  hooks/
    usePlaylist.ts
    usePlaylist.test.ts
  components/
    PlaylistCreatorForm.tsx
    PlaylistCreatorForm.test.tsx
```

### Configuration Recommendation
```typescript
// vitest.config.ts (monorepo root)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // for components
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      lines: 70,  // Suggested minimum coverage
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    }
  }
})
```

## How Errors Should Be Tested

**Given the ban on try/catch and use of `@jfdi/attempt`:**

Test error handling via the attempt pattern:

```typescript
// Example test for error scenario
import { matchTrack } from './trackMatching'
import { vi } from 'vitest'

describe('trackMatching', () => {
  it('should retry on failed search', async () => {
    const mockClient = {
      searchTracks: vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))  // Attempt 1 fails
        .mockRejectedValueOnce(new Error('Timeout'))        // Attempt 2 fails
        .mockResolvedValueOnce([{ uri: 'track:123', ... }]) // Attempt 3 succeeds
    }

    const result = await matchTrack(
      { title: 'Song', artist: 'Artist', album: 'Album' },
      mockClient
    )

    expect(result.matched).toBe(true)
    expect(mockClient.searchTracks).toHaveBeenCalledTimes(3)
  })

  it('should return unmatched after 3 failed attempts', async () => {
    const mockClient = {
      searchTracks: vi.fn()
        .mockRejectedValue(new Error('Always fails'))
    }

    const result = await matchTrack(
      { title: 'Song', artist: 'Artist', album: 'Album' },
      mockClient
    )

    expect(result.matched).toBe(false)
    expect(mockClient.searchTracks).toHaveBeenCalledTimes(3)
  })
})
```

## Mocking Strategy

**What to Mock:**
- External APIs (Music Assistant WebSocket, Claude/OpenAI SDKs)
- Database (use in-memory SQLite or mock)
- Network calls (fetch, EventSource)
- Date/Time (via `vi.useFakeTimers()`)

**What NOT to Mock:**
- Core business logic
- Zod validation (test with real schemas)
- Error handling with `@jfdi/attempt` (test real error paths)
- React Hooks (use React Testing Library instead)

**Mocking Pattern Example:**

```typescript
import { vi } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"tracks": [], "reasoning": "test"}' }]
      })
    }
  }))
}))

describe('ai.ts', () => {
  it('should call Claude with correct prompt', async () => {
    const result = await generatePlaylist(...)
    expect(Anthropic).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: process.env.ANTHROPIC_API_KEY
    }))
  })
})
```

## Fixtures and Test Data

**Location:** Create `backend/src/__fixtures__/` and `frontend/src/__fixtures__/` directories

**Patterns:**

```typescript
// __fixtures__/tracks.ts
export const MOCK_TRACK_SUGGESTION = {
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  album: 'A Night at the Opera'
}

export const MOCK_MA_TRACK = {
  uri: 'spotify://track/123',
  name: 'Bohemian Rhapsody',
  artists: [{ name: 'Queen' }],
  album: { name: 'A Night at the Opera' },
  provider: 'spotify',
  item_id: '123'
}

export const MOCK_TRACK_MATCH = {
  suggestion: MOCK_TRACK_SUGGESTION,
  matched: true,
  maTrack: MOCK_MA_TRACK,
  maMatches: undefined,
  selectedMatchIndex: 0
}

// Usage in tests
import { MOCK_TRACK_MATCH } from './__fixtures__/tracks'

describe('trackMatching', () => {
  it('should use fixture data', () => {
    expect(result).toEqual(MOCK_TRACK_MATCH)
  })
})
```

## Coverage Goals

**Suggested minimums:**
- Backend services: 80%+ (high-risk areas must be >90%)
- Backend routes: 70%+ (integration testing is secondary)
- Frontend hooks: 80%+ (state management is critical)
- Frontend components: 60%+ (snapshot + interaction tests)
- Overall: 70%+

**Areas requiring 100% coverage:**
- `attemptPromise` error paths (all error scenarios must be tested)
- Validation middleware (all schema violations must be tested)
- `trackMatching.ts` retry logic (all 3 attempts must be tested)

## CI/CD Integration

**Package scripts to add:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**GitHub Actions workflow:**
```yaml
- name: Run tests
  run: npm test -- --run --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Testing Challenges & Solutions

**Challenge: Music Assistant WebSocket**
- Solution: Mock the MusicAssistantClient class
- Test WebSocket connect/disconnect separately from business logic

**Challenge: SSE streaming in frontend**
- Solution: Mock EventSource globally in test setup
- Test event parsing and state updates independently

**Challenge: Database in tests**
- Solution: Use in-memory SQLite (`:memory:`) or mock with `vi.mock()`
- Ensure test isolation (reset DB between tests)

**Challenge: Time-dependent operations**
- Solution: Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
- Test retry delays in trackMatching (1s, 2s delays)

---

*Testing analysis: 2026-01-23*

**Note:** This codebase currently has zero test coverage. These recommendations should be followed when implementing tests in future phases.
