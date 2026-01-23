# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Large Hook File:**
- Issue: `usePlaylist.ts` is 276 lines, exceeding 200-line guidance. Contains complex state management for playlist generation, creation, refinement, and track operations.
- Files: `frontend/src/hooks/usePlaylist.ts`
- Impact: Harder to maintain, test, and extend. Multiple concerns mixed in one file.
- Fix approach: Split into smaller hooks (e.g., `usePlaylistGeneration`, `usePlaylistCreation`, `useTrackRefinement`, `useTrackOperations`). Each hook should handle one concern.

**Verbose Logging Throughout System:**
- Issue: System logs 23+ console statements across backend services (track matching, Music Assistant WebSocket, AI operations, playlist generation). No log levels, no formatting strategy.
- Files: `backend/src/services/trackMatching.ts`, `backend/src/services/musicAssistant.ts`, `backend/src/services/ai.ts`, `backend/src/services/playlistGenerator.ts`
- Impact: Logs are voluminous and inconsistent. Production deployment will be noisy. No way to filter by severity.
- Fix approach: Implement structured logging with levels (debug, info, warn, error). Centralise log formatting. Make logging configurable per environment.

**Job Store Memory Leak Risk:**
- Issue: `jobStore` relies on manual cleanup (every 15 minutes). Old jobs can accumulate if cleanup interval is modified or server doesn't run for extended periods.
- Files: `backend/src/services/jobStore.ts` (line 101-106)
- Impact: In-memory job storage unbounded growth on long-running servers, especially if many generation requests fail.
- Fix approach: Implement time-based job expiration with stronger guarantees (e.g., TTL set at creation, cleanup on every operation). Consider exporting completed jobs to history before cleanup.

**Regex-Based Refinement Detection:**
- Issue: `playlistRefine.ts` line 33 uses simple regex to detect "add/append/include" intent: `/\b(add|append|include)\b/i`. Single regex determines playlist append vs replace behaviour.
- Files: `backend/src/playlistRefine.ts` (line 33)
- Impact: User intent can be misinterpreted. Typos or word variations ("append" vs "add more") may not be recognized. Context-dependent requests fail silently.
- Fix approach: Improve intent detection with AI itself (ask LLM to classify intent) or more comprehensive pattern matching with fallback to user confirmation.

**Fragile WebSocket Message Handling:**
- Issue: `musicAssistant.ts` handles messages without guaranteed message_id. Silent returns if message_id missing or not in pending requests (lines 80-87).
- Files: `backend/src/services/musicAssistant.ts` (lines 80-87, 84-87)
- Impact: Orphaned responses silently discarded. Debugging connection issues is difficult. No alerts if Music Assistant sends unexpected message format.
- Fix approach: Log warnings for unexpected message types. Track received message_ids separately. Implement message validation schema.

---

## Known Bugs

**SSE Connection Not Fully Closed on Error:**
- Symptoms: SSE EventSource not closed if parsing fails mid-stream. Only initial message error closes connection properly.
- Files: `frontend/src/services/playlistApi.ts` (lines 36-56)
- Trigger: Malformed JSON in SSE update or Music Assistant connection drops mid-generation
- Workaround: Browser eventually times out connection, but hanging listeners accumulate briefly

**Track Matching Can Show Unmatched Results as Matching:**
- Symptoms: If final `matchTracksProgressively` batch succeeds but network drops before server sends final update, UI shows "matching: false" on unmatched track.
- Files: `backend/src/services/trackMatching.ts` (lines 93-96), `frontend/src/services/playlistApi.ts`
- Trigger: Network interruption during final batch processing or server crash during track matching
- Workaround: User manually retries failed track via "Retry" button

**Webhook Silently Fails After Retries:**
- Symptoms: Webhook retries 3 times then logs error but doesn't inform user. No failure notification sent to requesting system.
- Files: `backend/src/services/webhook.ts` (lines 44-48)
- Trigger: Downstream webhook endpoint unreachable or returns errors on all 3 attempts
- Workaround: Webhook initiator can poll job status endpoint, but has no indication of webhook failure

---

## Security Considerations

**No API Authentication Required:**
- Risk: All backend endpoints are publicly accessible. Anyone with network access can generate playlists, access job status, modify settings.
- Files: `backend/src/routes/playlists.ts`, `backend/src/routes/settings.ts`, `backend/src/routes/prompts.ts`
- Current mitigation: Documentation states "single-user, local network" deployment only. No firewall enforcement in code.
- Recommendations: (1) Add optional API key validation middleware. (2) Document network isolation requirement clearly. (3) Add warning logs if non-localhost requests detected.

**Settings Stored Plaintext in SQLite:**
- Risk: Music Assistant token and AI provider API keys stored unencrypted in `playlist.db`. Database file readable by any process with filesystem access.
- Files: `backend/src/db/schema.ts` (settings table), database file location should be documented
- Current mitigation: File system permissions only (depends on OS and server security posture).
- Recommendations: (1) Encrypt sensitive settings at rest using libsodium or similar. (2) Never log full API keys/tokens. (3) Add setting validation to detect common issues (empty keys).

**AI Provider API Keys Transmitted in Request Bodies:**
- Risk: Not immediately a vulnerability (HTTPS assumed in production), but API keys visible in logs and server memory.
- Files: `backend/src/routes/settings.ts` (update endpoint), `frontend/src/services/api.ts`
- Current mitigation: None
- Recommendations: (1) Never log full API keys in debug output. (2) Clear sensitive data from memory after use. (3) Add rate limiting to prevent API key enumeration attacks.

**Music Assistant Token Passed in WebSocket Connect:**
- Risk: Token transmitted in plaintext on WebSocket. If Music Assistant server is accessed over HTTP, token visible to network sniffing.
- Files: `backend/src/services/musicAssistant.ts` (line 62-65)
- Current mitigation: Depends on Music Assistant server using HTTPS/WSS
- Recommendations: Document requirement for WSS connections in production. Validate Music Assistant URL scheme.

---

## Performance Bottlenecks

**Sequential Webhook Retry Blocks Playlist Completion:**
- Problem: If webhook URL provided, playlist job waits for 3 webhook retry attempts (2s + 4s + 8s = up to 14s) before returning. User sees "completed" status delayed.
- Files: `backend/src/services/webhook.ts` (lines 10-44), `backend/src/services/playlistGenerator.ts` (lines 124-129)
- Cause: Webhook retry logic runs synchronously in same job context.
- Improvement path: Move webhook calls to background queue. Mark job "completed" immediately, send webhook async. Fallback to exponential backoff with max 3 retries.

**Track Matching Waits for Music Assistant Search Timeout:**
- Problem: If Music Assistant search hangs, all 3 retry attempts wait for timeout (default unclear from config). Single slow track can delay entire playlist.
- Files: `backend/src/services/trackMatching.ts` (lines 16-70), `backend/src/services/musicAssistant.ts` (line 131 references TIMEOUTS.WS_COMMAND)
- Cause: Sync retry loop waits for each attempt sequentially.
- Improvement path: Implement configurable timeout that's more aggressive (e.g., 5s instead of 10s). Skip to next track after 1 failed attempt if batch size > 100 tracks.

**Job Polling in Frontend Creates Repeated Requests:**
- Problem: Frontend doesn't have fallback if SSE fails. User is stuck with "generating" state. No polling mechanism implemented.
- Files: `frontend/src/services/playlistApi.ts` (EventSource-based approach only), `backend/src/routes/playlists.ts` (GET endpoint exists but not used by frontend)
- Cause: Frontend exclusively uses SSE. If EventSource errors, no retry to polling endpoint.
- Improvement path: Implement fallback polling if SSE fails. Use exponential backoff (1s, 2s, 4s, 8s) up to max 30s.

**Database Validation on Every Query:**
- Problem: `getPromptHistory()` and `getPresetPrompts()` validate every row with Zod. Inefficient for large history tables.
- Files: `backend/src/db/schema.ts` (lines 168-196, 198-225)
- Cause: Row-by-row validation instead of bulk validation.
- Improvement path: Cache preset prompts (static). Validate schema once at startup. Log validation errors but don't fail entire query.

---

## Fragile Areas

**Track Matching Progress Not Idempotent:**
- Files: `backend/src/services/trackMatching.ts`, `backend/src/services/playlistGenerator.ts`
- Why fragile: If SSE connection drops mid-matching, frontend and backend lose sync on which tracks have been matched. User can't resume from last successful match.
- Safe modification: (1) Always include track IDs in progress updates. (2) Store progress in database, not just in-memory job store. (3) Allow frontend to request full job state to resync.
- Test coverage: No tests for SSE interruption scenarios.

**AI Response Parsing Vulnerable to Format Changes:**
- Files: `backend/src/services/ai.ts` (lines 65-82)
- Why fragile: Regex-based markdown code block detection (line 67) is brittle. If AI wraps response differently, parsing fails.
- Safe modification: (1) Validate response against schema BEFORE trying to parse. (2) Return structured error message showing what was received. (3) Add response formatter step that normalises common variations.
- Test coverage: No tests for malformed AI responses or edge cases.

**EventSource Connection Doesn't Support Reconnection:**
- Files: `frontend/src/services/playlistApi.ts` (lines 33-63)
- Why fragile: EventSource doesn't implement reconnection logic. Single network hiccup drops entire connection.
- Safe modification: (1) Use a reconnection strategy (exponential backoff). (2) Implement manual reconnection with last-event-id tracking. (3) Or switch to WebSocket for bidirectional reliability.
- Test coverage: No tests for connection loss scenarios.

**Batch Processing Silently Fails Individual Tracks:**
- Files: `backend/src/services/trackMatching.ts` (lines 82-99)
- Why fragile: Promise.all in batch processing means if one track throws, entire batch's error is handled but not properly logged per-track.
- Safe modification: (1) Use Promise.allSettled instead to capture per-track results. (2) Log which specific tracks failed. (3) Consider partial retries for failed tracks.
- Test coverage: No tests for individual track failure handling.

---

## Scaling Limits

**In-Memory Job Store Unbounded:**
- Current capacity: Limited by available RAM. With 15-minute cleanup, job count grows unbounded if generation rate > cleanup capacity.
- Limit: Server will OOM if > 10,000 concurrent/recent jobs (rough estimate).
- Scaling path: (1) Move job state to Redis or database. (2) Implement job expiration with sliding window. (3) Archive completed jobs to history table.

**SQLite Single-Writer Limitation:**
- Current capacity: SQLite allows only one concurrent write. Multiple playlist generations trying to save history will queue.
- Limit: Playlist creation lock contention if > 5 concurrent create requests.
- Scaling path: (1) Batch history writes (write every 10 jobs or 5 seconds). (2) Move to PostgreSQL if scaling beyond single server. (3) Implement write-ahead logging with higher timeout.

**Music Assistant Search Returns Fixed Limit:**
- Current capacity: Search limited to 5 results per track (LIMITS.SEARCH_TRACKS). Provider filtering happens client-side.
- Limit: If user has many provider instances, top result might be from non-preferred provider.
- Scaling path: (1) Increase search limit and filter server-side. (2) Implement provider ranking in Music Assistant if available. (3) Cache provider preferences for faster filtering.

---

## Dependencies at Risk

**EventSource API Not Fully Standardized:**
- Risk: EventSource API is browser-native but limited. No automatic reconnection. Requires manual fallback implementation.
- Impact: SSE reliability depends on client-side workarounds not currently implemented.
- Migration plan: (1) Add exponential backoff reconnection for EventSource. (2) Or implement WebSocket fallback if SSE fails. (3) Consider libraries like `eventsource` npm package for more robust client.

**Better SQLite Abandoned:**
- Risk: `better-sqlite3` (backend dependency) is maintained but not as actively as native drivers. Performance may degrade with newer Node versions.
- Impact: Database operations could become slower in future Node versions. Migration to other SQL drivers would require refactoring.
- Migration plan: (1) Keep current for now (works well). (2) Monitor for performance regressions. (3) Plan migration to `bun:sqlite` or native Node SQL modules when Node drivers mature.

---

## Missing Critical Features

**No Persistence of Generation Progress:**
- Problem: If server restarts during playlist generation, all job state lost. User has no way to recover.
- Blocks: Production deployment confidence. Can't safely restart server during active jobs.
- Impact: Users lose work mid-generation. No audit trail of what was generated.

**No Job Timeout Enforcement:**
- Problem: A stuck AI generation or Music Assistant search can hang job indefinitely. No timeout configured for overall job completion.
- Blocks: Long-running jobs can accumulate, degrading server performance over time.
- Impact: Resource leak. No clear SLA for when jobs will complete.

**No Rate Limiting:**
- Problem: Any client can spam playlist generation requests. No throttling per client/user.
- Blocks: Server vulnerable to DOS attacks. Can't control resource usage.
- Impact: Single bad actor can make server unusable for others.

---

## Test Coverage Gaps

**Track Matching Retry Logic:**
- What's not tested: (1) Behaviour after 3 failed retries. (2) What happens if Music Assistant returns empty array on attempt 1 but success on attempt 2. (3) Performance under slow searches.
- Files: `backend/src/services/trackMatching.ts`
- Risk: Retry logic changes could accidentally skip retries or retry too aggressively, causing flaky matching.
- Priority: High - retry logic is core to playlist quality.

**Playlist Generation Job State Transitions:**
- What's not tested: (1) Concurrent updates to same job. (2) SSE listener cleanup on client disconnect. (3) Error state handling with webhook callbacks.
- Files: `backend/src/services/jobStore.ts`, `backend/src/routes/playlists.ts`
- Risk: Race conditions in job updates could cause inconsistent state. Listener cleanup failures could leak memory.
- Priority: High - job state is critical to user experience.

**AI Provider Fallback Behaviour:**
- What's not tested: (1) What happens when primary provider fails and fallback is selected. (2) Temperature and model parameter variations. (3) Handling of AI responses that partially match schema.
- Files: `backend/src/services/ai.ts`, `backend/src/utils/providerUtils.ts`
- Risk: Provider selection logic could fail silently. AI parameter changes could cause unexpected playlist quality variations.
- Priority: Medium - affects playlist quality.

**SSE Streaming with Large Track Lists:**
- What's not tested: (1) Streaming 100+ tracks doesn't overflow message buffers. (2) Message order preserved on slow connections. (3) Client disconnection mid-stream cleanup.
- Files: `frontend/src/services/playlistApi.ts`, `backend/src/routes/playlists.ts`
- Risk: Large playlists could cause SSE buffer overflow or message loss. Connection drops could leave orphaned listeners.
- Priority: Medium - affects large playlist generation.

**Frontend State Synchronisation on Network Errors:**
- What's not tested: (1) Frontend state consistency if SSE fails and polling resumes. (2) Track list updates with network interruptions. (3) User cancelling generation mid-stream.
- Files: `frontend/src/services/playlistApi.ts`, `frontend/src/hooks/usePlaylist.ts`
- Risk: Stale UI state if network errors occur. User confusion about actual job status.
- Priority: Medium - affects user experience during network issues.

**Settings Validation:**
- What's not tested: (1) Invalid Music Assistant URLs don't crash system. (2) Empty/missing API keys handled gracefully. (3) Settings migration if schema changes.
- Files: `backend/src/routes/settings.ts`, `backend/src/db/schema.ts`
- Risk: Invalid settings could cause cascade failures. No clear error messages for misconfiguration.
- Priority: Low - settings usually set once, but impacts first-run experience.

---

*Concerns audit: 2026-01-23*
