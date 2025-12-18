# Fix Music Assistant Authentication (Issue #7)

## Problem
Music Assistant 2.7 made authentication mandatory. The WebSocket connects fine but subsequent commands fail without sending an auth token first. The current "Test Connection" button only tests WebSocket connectivity, not authentication.

## Authentication Flow (from MA frontend code)
1. WebSocket connects → server sends `ServerInfoMessage`
2. Client sends `auth` command with `{ token: "<access_token>", device_name: "<name>" }`
3. Server responds with success → client is authenticated
4. Subsequent commands work

Token is obtained from MA web UI:
1. Log into Music Assistant web interface
2. Open browser dev tools (F12) → Application tab → Local Storage
3. Find key `ma_access_token` and copy its value

## Implementation Plan

### 1. Add `musicAssistantToken` setting

**File: `shared/settings-schema.ts`**
- Add new setting field:
```typescript
musicAssistantToken: {
  key: 'musicAssistantToken',
  type: 'string',
  optional: true,
  zodSchema: z.string().optional()
}
```
- Update `AppSettingsSchema` and `UpdateSettingsRequestSchema`
- Update `getSettings` return type

### 2. Update MusicAssistantClient to authenticate

**File: `backend/src/services/musicAssistant.ts`**
- Modify `connect()` to accept optional token parameter
- After WebSocket opens, if token provided, send `auth` command:
```typescript
await this.sendCommand('auth', {
  token,
  device_name: 'music-assistant-ai-playlist-creator'
});
```
- Only proceed once auth succeeds

### 3. Update all client usages to pass token

**Files:**
- `backend/src/utils/maClientUtils.ts` - `withMusicAssistant(url, token, operation)`
- `backend/src/services/playlistGenerator.ts` - pass token to client
- `backend/src/services/playlistRefine.ts` - pass token to client
- `backend/src/services/playlistCreator.ts` - pass token to client
- `backend/src/routes/playlists.ts` - pass token in test-ma endpoint

### 4. Fix test connection endpoint

**File: `backend/src/routes/playlists.ts`**
- Change `/playlists/test-ma` to actually test authentication
- Accept both `musicAssistantUrl` and `musicAssistantToken` in request body
- Call a simple MA command (e.g., `getFavoriteArtists`) to verify auth works
- Return specific error if auth fails vs connection fails

### 5. Update frontend settings UI

**File: `frontend/src/components/SettingsPage.tsx`**
- Add token input field (type="password" for security)
- Pass token to test connection API call
- Show appropriate error messages for auth failures

**File: `frontend/src/hooks/useSettings.ts`**
- Add `musicAssistantToken` to state management

**File: `frontend/src/services/playlistApi.ts`**
- Update `testMusicAssistantConnection` to accept token

### 6. Update README

**File: `README.md`**
- Document that MA 2.7+ requires authentication
- Explain how to obtain token from MA web UI

## Files to Modify
1. `shared/settings-schema.ts` - add token setting
2. `backend/src/services/musicAssistant.ts` - add auth flow
3. `backend/src/utils/maClientUtils.ts` - pass token
4. `backend/src/services/playlistGenerator.ts` - pass token
5. `backend/src/services/playlistRefine.ts` - pass token
6. `backend/src/services/playlistCreator.ts` - pass token
7. `backend/src/routes/playlists.ts` - fix test endpoint
8. `frontend/src/components/SettingsPage.tsx` - token UI
9. `frontend/src/hooks/useSettings.ts` - token state
10. `frontend/src/services/playlistApi.ts` - token in API
11. `README.md` - documentation
