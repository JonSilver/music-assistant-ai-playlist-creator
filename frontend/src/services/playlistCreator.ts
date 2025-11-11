import { attemptPromise } from '@jfdi/attempt'
import { MusicAssistantClient } from './musicAssistant'
import type { TrackMatch } from '@shared/types'

export const createPlaylist = async (
  playlistName: string,
  tracks: TrackMatch[],
  musicAssistantUrl: string
): Promise<{ playlistId: string; tracksAdded: number; playlistUrl: string }> => {
  const maClient = new MusicAssistantClient(musicAssistantUrl)
  await maClient.connect()

  const playlistId = await maClient.createPlaylist(playlistName.trim())

  const trackUris = tracks
    .filter(m => m.matched && m.maTrack !== undefined)
    .map(m => {
      if (m.maTrack === undefined) {
        throw new Error('Unexpected undefined maTrack')
      }
      return m.maTrack.uri
    })

  if (trackUris.length > 0) {
    await maClient.addTracksToPlaylist(playlistId, trackUris)
  }

  maClient.disconnect()

  const playlistUrl = `${musicAssistantUrl}/#/playlists/library/${playlistId}`

  return { playlistId, tracksAdded: trackUris.length, playlistUrl }
}

export const refinePlaylist = async (
  refinementPrompt: string,
  currentTracks: TrackMatch[],
  musicAssistantUrl: string,
  aiProvider: 'claude' | 'openai',
  apiKey: string,
  model?: string,
  baseUrl?: string,
  customSystemPrompt?: string,
  temperature?: number
): Promise<TrackMatch[]> => {
  const { generatePlaylist: generatePlaylistAI } = await import('./ai')

  const [maConnectErr, maClient] = await attemptPromise(async () => {
    const client = new MusicAssistantClient(musicAssistantUrl)
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

  const trackList = currentTracks.map(
    (m: TrackMatch) => `${m.suggestion.title} by ${m.suggestion.artist}`
  )
  const refinementContext = `Current playlist:\n${trackList.join('\n')}\n\nRefinement request: ${refinementPrompt.trim()}`

  const [aiErr, aiResult] = await attemptPromise(async () =>
    generatePlaylistAI({
      prompt: refinementContext,
      favoriteArtists,
      provider: aiProvider,
      apiKey,
      model,
      baseUrl,
      customSystemPrompt,
      temperature
    })
  )

  if (aiErr !== undefined) {
    throw new Error(`Failed to refine playlist: ${aiErr.message}`)
  }

  return aiResult.tracks.map(suggestion => ({
    suggestion,
    matched: false,
    matching: true
  }))
}
