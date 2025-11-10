import { attemptPromise } from '@jfdi/attempt'
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  RefinePlaylistRequest,
  PromptHistory,
  PresetPrompt,
  TrackMatch
} from '@shared/types'

const backendPort = (import.meta.env.VITE_BACKEND_PORT as string | undefined) ?? '3333'
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? `http://localhost:${backendPort}/api`

interface ErrorResponse {
  error?: string
}

const fetchJSON = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined)
    }
  })

  if (!response.ok) {
    const [err, errorBody] = await attemptPromise<ErrorResponse>(
      async () => (await response.json()) as ErrorResponse
    )
    const message =
      err === undefined && errorBody.error !== undefined ? errorBody.error : response.statusText
    throw new Error(message)
  }

  return (await response.json()) as T
}

export const api = {
  // Settings
  getSettings: async () => attemptPromise<GetSettingsResponse>(async () => fetchJSON('/settings')),

  updateSettings: async (updates: UpdateSettingsRequest) =>
    attemptPromise<{ success: boolean }>(async () =>
      fetchJSON('/settings', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    ),

  // Playlist operations
  generatePlaylist: async (request: CreatePlaylistRequest) =>
    attemptPromise<CreatePlaylistResponse>(async () =>
      fetchJSON('/playlist/generate', {
        method: 'POST',
        body: JSON.stringify(request)
      })
    ),

  createPlaylist: async (data: { playlistName: string; tracks: TrackMatch[] }) =>
    attemptPromise<{ success: boolean; playlistId: string; tracksAdded: number }>(async () =>
      fetchJSON('/playlist/create', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    ),

  refinePlaylist: async (request: RefinePlaylistRequest) =>
    attemptPromise<{
      success: boolean
      matches: TrackMatch[]
      totalSuggested: number
      totalMatched: number
    }>(async () =>
      fetchJSON('/playlist/refine', {
        method: 'POST',
        body: JSON.stringify(request)
      })
    ),

  // Prompts
  getPromptHistory: async () =>
    attemptPromise<{ history: PromptHistory[] }>(async () => fetchJSON('/prompts/history')),

  getPresetPrompts: async () =>
    attemptPromise<{ presets: PresetPrompt[] }>(async () => fetchJSON('/prompts/presets')),

  // Connection tests
  testMusicAssistant: async (url: string) =>
    attemptPromise<{ success: boolean; error?: string }>(async () =>
      fetchJSON('/settings/test/music-assistant', {
        method: 'POST',
        body: JSON.stringify({ url })
      })
    ),

  testAnthropic: async (apiKey: string) =>
    attemptPromise<{ success: boolean; error?: string }>(async () =>
      fetchJSON('/settings/test/anthropic', {
        method: 'POST',
        body: JSON.stringify({ apiKey })
      })
    ),

  testOpenAI: async (apiKey: string, baseUrl?: string) =>
    attemptPromise<{ success: boolean; error?: string }>(async () =>
      fetchJSON('/settings/test/openai', {
        method: 'POST',
        body: JSON.stringify({ apiKey, baseUrl })
      })
    )
}
