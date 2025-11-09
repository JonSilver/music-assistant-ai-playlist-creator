import { attempt } from '@jfdi/attempt'
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

const fetchJSON = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })

  if (!response.ok) {
    const error = await attempt(async () => response.json())
    const message = error.ok ? (error.value as { error?: string }).error : response.statusText
    throw new Error(message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export const api = {
  // Settings
  getSettings: () => fetchJSON<GetSettingsResponse>('/settings'),

  updateSettings: (updates: UpdateSettingsRequest) =>
    fetchJSON<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  // Playlist operations
  generatePlaylist: (request: CreatePlaylistRequest) =>
    fetchJSON<CreatePlaylistResponse>('/playlist/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    }),

  createPlaylist: (data: { playlistName: string; matches: CreatePlaylistResponse['matches']; prompt: string }) =>
    fetchJSON<{ success: boolean; playlistId: string; trackCount: number }>('/playlist/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  refinePlaylist: (request: RefinePlaylistRequest) =>
    fetchJSON<{ success: boolean; matches: CreatePlaylistResponse['matches']; totalSuggested: number; totalMatched: number }>('/playlist/refine', {
      method: 'POST',
      body: JSON.stringify(request)
    }),

  // Prompts
  getHistory: () => fetchJSON<PromptHistory[]>('/prompts/history'),

  getPresets: () => fetchJSON<PresetPrompt[]>('/prompts/presets')
}
