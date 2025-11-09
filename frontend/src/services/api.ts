import { attemptPromise } from '@jfdi/attempt'
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  RefinePlaylistRequest,
  PromptHistory,
  PresetPrompt
} from '@shared/types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

interface ErrorResponse {
  error?: string
}

const fetchJSON = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  })

  if (!response.ok) {
    const [err, errorBody] = await attemptPromise<ErrorResponse>(async () => response.json())
    const message =
      err === undefined && errorBody.error !== undefined ? errorBody.error : response.statusText
    throw new Error(message)
  }

  return response.json() as Promise<T>
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

  createPlaylist: async (data: {
    playlistName: string
    tracks: CreatePlaylistResponse['tracks']
  }) =>
    attemptPromise<{ success: boolean; playlistId: string; tracksAdded: number }>(async () =>
      fetchJSON('/playlist/create', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    ),

  refinePlaylist: async (request: RefinePlaylistRequest) =>
    attemptPromise<{
      success: boolean
      tracks: CreatePlaylistResponse['tracks']
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
    attemptPromise<{ presets: PresetPrompt[] }>(async () => fetchJSON('/prompts/presets'))
}
