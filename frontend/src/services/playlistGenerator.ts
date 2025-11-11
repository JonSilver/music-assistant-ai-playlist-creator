import { attemptPromise } from '@jfdi/attempt'
import { MusicAssistantClient } from './musicAssistant'
import { generatePlaylist as generatePlaylistAI } from './ai'
import type { AIProvider, TrackMatch } from '@shared/types'

export interface GeneratePlaylistParams {
  prompt: string
  trackCount: string
  musicAssistantUrl: string
  aiProvider: AIProvider
  apiKey: string
  model?: string
  baseUrl?: string
  customSystemPrompt?: string
  temperature?: number
}

export const generatePlaylist = async (params: GeneratePlaylistParams): Promise<TrackMatch[]> => {
  const parsedTrackCount = parseInt(params.trackCount, 10)

  const [maConnectErr, maClient] = await attemptPromise(async () => {
    const client = new MusicAssistantClient(params.musicAssistantUrl)
    await client.connect()
    return client
  })

  if (maConnectErr !== undefined) {
    throw new Error(`Failed to connect to Music Assistant: ${maConnectErr.message}`)
  }

  const [favoriteErr, favoriteArtists] = await attemptPromise(async () =>
    maClient.getFavoriteArtists()
  )
  maClient.disconnect()

  if (favoriteErr !== undefined) {
    throw new Error(`Failed to get favorite artists: ${favoriteErr.message}`)
  }

  const [aiErr, aiResult] = await attemptPromise(async () =>
    generatePlaylistAI({
      prompt: params.prompt.trim(),
      favoriteArtists,
      provider: params.aiProvider,
      apiKey: params.apiKey,
      model: params.model,
      baseUrl: params.baseUrl,
      customSystemPrompt: params.customSystemPrompt,
      temperature: params.temperature,
      trackCount: !isNaN(parsedTrackCount) && parsedTrackCount > 0 ? parsedTrackCount : undefined
    })
  )

  if (aiErr !== undefined) {
    throw new Error(`Failed to generate playlist: ${aiErr.message}`)
  }

  return aiResult.tracks.map(suggestion => ({
    suggestion,
    matched: false,
    matching: true
  }))
}
