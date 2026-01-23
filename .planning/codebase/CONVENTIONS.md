# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- PascalCase for components: `PlaylistCreatorForm.tsx`, `ErrorBoundary.tsx`
- camelCase for services and utilities: `playlistGenerator.ts`, `trackMatching.ts`, `usePlaylist.ts`
- camelCase for hooks: `usePlaylist.ts`, `useSettings.ts`, `useAlerts.ts`
- camelCase for context files: `AppContext.tsx`, `AlertsContext.tsx`
- Prefix interfaces with `I`: `IPlaylistCreatorFormProps`, `IPlaylistGeneratorParams`
- Database/schema files: `schema.ts`

**Functions:**
- camelCase for regular functions: `generatePlaylist()`, `matchTrack()`, `validateRequest()`
- Higher-order functions and middleware use camelCase: `createJob()`, `validateRequest()`
- Export functions are named exports, not default exports
- Exported functions from services always have explicit return types

**Variables:**
- camelCase for all variables: `playlistName`, `musicAssistantUrl`, `trackCount`
- Boolean variables often use prefix patterns: `isAddRequest`, `hasError`, `matching`
- Constants in UPPERCASE: `BATCH_SIZE`, `PAYLOAD_LIMIT`, `DEFAULT_BACKEND_PORT`

**Types:**
- Interfaces prefixed with `I`: `IPlaylistCreatorFormProps`, `IAppContextType`
- Type suffixes: `...Schema` for Zod validators, `...Response` for API responses, `...Request` for API requests
- Example: `BackendGeneratePlaylistRequestSchema`, `BackendGeneratePlaylistResponse`, `TrackMatch`

## Code Style

**Formatting:**
- Prettier 3.6.2 with configuration in `.prettierrc.json`:
  - 4-space indentation
  - Print width: 100 characters
  - Single quotes
  - Semicolons: always
  - Trailing commas: none (ES5)
  - Arrow parens: avoid when possible
  - Line endings: LF

**Linting:**
- Oxlint 1.2.0 with config in `.oxlintrc.json`
- Key rules enforced:
  - `typescript/no-explicit-any` - error (strict no `any` types)
  - `typescript/no-non-null-assertion` - error (no `!` assertions)
  - `typescript/consistent-type-imports` - error (use `import type {}` syntax)
  - `max-lines` - warn at 200 lines per file (skipBlankLines, skipComments)
  - `eqeqeq` - error (always use `===` and `!==`)
  - `no-debugger`, `no-alert` - error
  - React hooks validation enforced

**TypeScript Configuration:**
- Strict mode enabled
- Target: ES2022
- Module resolution: NodeNext (for ESM)
- Path aliases in use: `@shared/*` maps to `../shared/*` in backend/frontend

## Import Organization

**Order:**
1. External dependencies (React, libraries): `import React from "react"`, `import { attemptPromise } from "@jfdi/attempt"`
2. Type imports: `import type { TrackMatch } from "@shared/types"`
3. Local module imports: `import { PlaylistCreatorForm } from "./PlaylistCreatorForm"`
4. Relative imports: `import { useAlerts } from "../hooks/useAlerts"`

**Type Import Syntax:**
- CORRECT: `import type { Foo } from "./types.js"`
- CORRECT: `import type { Foo, Bar } from "./types.js"`
- WRONG: `import { type Foo } from "./types.js"` (not used in this codebase)

**Path Aliases:**
- Backend: `@shared/*` for shared directory access
- Frontend: `@shared/*` for shared directory access
- Imports always use `.js` extensions for ESM: `from "./services/ai.js"`

## Error Handling

**Pattern:**
- NO try/catch blocks (banned in CLAUDE.md)
- Use `@jfdi/attempt` package for all error handling
- Async operations: `attemptPromise(async () => { ... })`
- Sync operations: `attempt(() => { ... })`
- Always destructure: `const [err, result] = await attemptPromise(...)`
- Check errors first: `if (err !== undefined) { ... }`

**Examples from codebase:**

Async pattern:
```typescript
const [aiErr, aiResult] = await attemptPromise(async () =>
    generatePlaylistAI({
        prompt,
        favoriteArtists,
        providerConfig,
        customSystemPrompt,
        trackCount
    })
);

if (aiErr !== undefined)
    throw new Error(`AI generation failed: ${aiErr.message}`);
```

Sync pattern:
```typescript
const [parseErr, data] = attempt<unknown>(() => JSON.parse(jsonContent));
if (parseErr !== undefined) {
    const preview = content.substring(0, 200);
    throw new Error(`Failed to parse AI response as JSON. Response start: ${preview}`);
}
```

**Validation with Zod:**
- Use `schema.safeParse()` for validation
- Check `.success` property and throw or handle errors
- Example from `ai.ts`:
```typescript
const parseResult = AIPlaylistResponseSchema.safeParse(data);
if (!parseResult.success)
    throw new Error(`Invalid AI response structure: ${parseResult.error.message}`);
```

## Logging

**Framework:** `console` (no special logging library)

**Patterns:**
- Informational: `console.log()`
- Warnings: `console.warn()`
- Errors: `console.error()`
- Include timestamps in logs: `[${new Date().toISOString()}]`
- Include prefixes for context: `[MATCH]`, `[Job ${jobId}]`

**Examples from `trackMatching.ts`:**
```typescript
console.log(
    `[${new Date().toISOString()}] [MATCH] Searching: "${suggestion.title}" by "${suggestion.artist}"`
);
console.warn(
    `[${new Date().toISOString()}] [MATCH] Attempt ${attempt}/3 failed after ${attemptDurationMs}ms: ${reason}`
);
console.error(
    `[${new Date().toISOString()}] [MATCH] ❌ Failed after 3 attempts (${totalDurationMs}ms total): "${suggestion.title}" by "${suggestion.artist}"`,
    reason
);
```

## Comments

**When to Comment:**
- Document complex algorithms (e.g., track matching retry logic)
- Explain why something is done a certain way (not what it does)
- Mark intentional workarounds or hacks with reasoning
- Use JSDoc for exported functions and their parameters

**JSDoc/TSDoc:**
- Used extensively for utility functions and exports
- Include `@param`, `@returns` descriptions
- Optional `@public` marker for cross-workspace exports

**Example from `sortByProviderWeight.ts`:**
```typescript
/**
 * Calculate weight for a provider string based on keyword matches
 * @param provider - The provider string from MA track
 * @param keywords - Ordered array of keywords (position = weight)
 * @returns Total weight (sum of all matching keyword weights), or Infinity if no matches
 */
const calculateProviderWeight = (provider: string, keywords: string[]): number => {
    if (keywords.length === 0)
        return 0; // No weighting configured

    // ... implementation
};
```

**Disabled Rules:**
- `max-lines` is suppressed with `/* eslint-disable max-lines */` at top of `usePlaylist.ts` (legitimate exception)

## Function Design

**Size:** Max 200 lines per file (oxlint rule enforced). Larger functions should be split.

**Parameters:**
- Use object destructuring for multiple parameters
- Define interface for parameter objects: `interface GeneratePlaylistParams { ... }`
- Example from `playlistGenerator.ts`:
```typescript
interface GeneratePlaylistParams {
    jobId: string;
    prompt: string;
    musicAssistantUrl: string;
    musicAssistantToken?: string;
    providerConfig: AIProviderConfig;
    customSystemPrompt?: string;
    providerKeywords?: string[];
    webhookUrl?: string;
    trackCount?: number;
}

export const generatePlaylistJob = async (
    params: GeneratePlaylistParams,
    db: PlaylistDatabase
): Promise<void> => {
    const {
        jobId,
        prompt,
        musicAssistantUrl,
        // ... destructure all params
    } = params;
```

**Return Values:**
- All functions must have explicit return type annotations
- Async functions return `Promise<T>`
- Fire-and-forget async operations use return type `void`
- Example: `export const generatePlaylistJob = async (...): Promise<void> => { ... }`

**Arrow Functions:**
- Prefer arrow functions: `const fn = () => { ... }`
- Use in event handlers and callbacks
- Omit parentheses for single parameters when possible

## Module Design

**Exports:**
- Named exports only (no default exports)
- Backend services export functions: `export const generatePlaylistJob = ...`
- Frontend hooks export hook function and return type interface: `export const usePlaylist = (...)`, `export interface UsePlaylistReturn { ... }`

**Barrel Files:**
- Not widely used in this codebase
- Imports are direct to source files

**Shared Types Pattern:**
- All API contracts and shared types live in `shared/types.ts`
- Uses Zod for schema validation: `export const FooSchema = z.object({ ... })`
- Exports both schema and type: `export type Foo = z.infer<typeof FooSchema>`
- Example:
```typescript
export const TrackSuggestionSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string().optional()
})
export type TrackSuggestion = z.infer<typeof TrackSuggestionSchema>
```

**Backend Response Construction:**
- Always use typed variable for responses
- Never inline response objects
- Example from `playlists.ts`:
```typescript
const response: BackendGeneratePlaylistResponse = { jobId };
res.json(response);
```

## React Patterns

**Functional Components:**
- React.FC pattern: `export const ComponentName: React.FC<IProps> = (props) => { ... }`
- Type props interface: `interface IComponentNameProps { ... }`
- No class components (except ErrorBoundary which is a legacy exception)

**Hooks:**
- Use React hooks for state management (useState, useEffect, useCallback)
- Dependency arrays required for useEffect and useCallback
- Prefer useCallback over memoization

**Context & State:**
- State management via React Context: `AppContext`, `AlertsContext`
- Custom hooks wrap Context usage: `useApp()`, `useAlerts()`
- No prop drilling (use Context instead)

**Example component from `PlaylistCreatorForm.tsx`:**
```typescript
interface IPlaylistCreatorFormProps {
    playlistName: string;
    prompt: string;
    trackCount: string;
    generating: boolean;
    providers: AIProviderConfig[];
    selectedProviderId: string | null;
    onPlaylistNameChange: (value: string) => void;
    onPromptChange: (value: string) => void;
    onTrackCountChange: (value: string) => void;
    onProviderChange: (providerId: string) => void;
    onGenerate: () => void;
}

export const PlaylistCreatorForm: React.FC<IPlaylistCreatorFormProps> = ({
    playlistName,
    prompt,
    // ... destructured props
}) => {
    // component implementation
};
```

## Common Patterns to Follow

**Initializing Tracks:**
- ALL tracks must start with `matching: true` to prevent UI flash of "NOT FOUND"
- Use `createUnmatchedTracks()` utility from `trackUtils.ts`
```typescript
const initialTracks: TrackMatch[] = createUnmatchedTracks(aiResult.tracks);
// This sets matched: false, matching: true
```

**API Response Type Patterns:**
- Backend always returns typed response object
- Frontend uses `backendFetch<ResponseType>()` which returns the typed response directly
- Example:
```typescript
// Backend route
const response: BackendGeneratePlaylistResponse = { jobId };
res.json(response);

// Frontend call
const startResponse = await backendFetch<BackendGeneratePlaylistResponse>(...);
const { jobId } = startResponse;
```

**Middleware & Validation:**
- Request validation uses Zod schemas and middleware
- Example from `validation.ts`:
```typescript
export const validateRequest = <T>(schema: z.ZodType<T>) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid request",
                details: parseResult.error.message
            });
            return;
        }
        req.body = parseResult.data;
        next();
    };
```

---

*Convention analysis: 2026-01-23*
