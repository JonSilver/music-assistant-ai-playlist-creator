import type { Router, Request, Response } from 'express'
import { attempt } from '@jfdi/attempt'
import { MusicAssistantClient } from '../services/musicAssistant.js'
import { AIService } from '../services/ai.js'
import type { PlaylistDatabase } from '../db/schema.js'
import type {
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  CreatePlaylistInMAResponse,
  RefinePlaylistRequest,
  RefinePlaylistResponse,
  TrackMatch,
  TrackSuggestion
} from '../../../shared/types.js'

const matchTrack = async (
  suggestion: TrackSuggestion,
  maClient: MusicAssistantClient
): Promise<TrackMatch> => {
  // Use Music Assistant's search to find the track
  const searchQuery = `${suggestion.title} ${suggestion.artist}`
  const searchResults = await maClient.searchTracks(searchQuery, 5)

  if (searchResults.length > 0) {
    // Take the first result as the best match
    return {
      suggestion,
      matched: true,
      maTrack: searchResults[0]
    }
  }

  // No match found
  return {
    suggestion,
    matched: false
  }
}

export const setupPlaylistRoutes = (router: Router, db: PlaylistDatabase): void => {
  // Generate playlist suggestions
  router.post('/playlist/generate', async (req: Request, res: Response) => {
    const request = req.body as CreatePlaylistRequest

    const [err, result] = await attempt(async () => {
      // Get settings
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiBaseUrl = db.getSetting('openaiBaseUrl')
      const customSystemPrompt = db.getSetting('customSystemPrompt')
      const temperatureStr = db.getSetting('temperature')
      const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined

      if (maUrl === null || maUrl.length === 0) {
        throw new Error('Music Assistant URL not configured')
      }

      // Connect to Music Assistant
      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      // Get favorite artists for context
      const favoriteArtists = await maClient.getFavoriteArtists()

      // Get AI suggestions
      const aiService = new AIService(
        anthropicKey ?? undefined,
        openaiKey ?? undefined,
        openaiBaseUrl ?? undefined
      )
      const aiResponse = await aiService.generatePlaylist({
        prompt: request.prompt,
        favoriteArtists,
        provider: request.provider ?? aiProvider,
        customSystemPrompt: customSystemPrompt ?? undefined,
        temperature
      })

      // Match AI suggestions using Music Assistant search
      const matches: TrackMatch[] = await Promise.all(
        aiResponse.tracks.map(suggestion => matchTrack(suggestion, maClient))
      )

      maClient.disconnect()

      const response: CreatePlaylistResponse = {
        success: true,
        playlistName: request.playlistName ?? 'AI Generated Playlist',
        matches,
        totalSuggested: matches.length,
        totalMatched: matches.filter(m => m.matched).length
      }

      return response
    })

    if (err !== undefined) {
      res.status(500).json({
        error: 'Failed to generate playlist',
        details: err.message
      })
      return
    }

    res.json(result)
  })

  // Create playlist in Music Assistant
  router.post('/playlist/create', async (req: Request, res: Response) => {
    const { playlistName, tracks } = req.body as { playlistName: string; tracks: TrackMatch[] }

    const [err, result] = await attempt(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      if (maUrl === null || maUrl.length === 0) {
        throw new Error('Music Assistant URL not configured')
      }

      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      // Create playlist
      const playlistId = await maClient.createPlaylist(playlistName)

      // Add matched tracks
      const trackUris = tracks
        .filter(m => m.matched && m.maTrack !== undefined)
        .map(m => m.maTrack!.uri)

      if (trackUris.length > 0) {
        await maClient.addTracksToPlaylist(playlistId, trackUris)
      }

      maClient.disconnect()

      // Save to history
      const promptFromBody = req.body.prompt as string | undefined
      db.addPromptHistory(promptFromBody ?? 'Unknown', playlistName, trackUris.length)

      const response: CreatePlaylistInMAResponse = {
        success: true,
        playlistId,
        tracksAdded: trackUris.length
      }
      return response
    })

    if (err !== undefined) {
      res.status(500).json({
        error: 'Failed to create playlist',
        details: err.message
      })
      return
    }

    res.json(result)
  })

  // Refine playlist
  router.post('/playlist/refine', async (req: Request, res: Response) => {
    const request = req.body as RefinePlaylistRequest

    const [err, result] = await attempt(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiBaseUrl = db.getSetting('openaiBaseUrl')
      const customSystemPrompt = db.getSetting('customSystemPrompt')
      const temperatureStr = db.getSetting('temperature')
      const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined

      if (maUrl === null || maUrl.length === 0) {
        throw new Error('Music Assistant URL not configured')
      }

      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      const favoriteArtists = await maClient.getFavoriteArtists()

      // Build refinement prompt
      const currentTracks = request.currentTracks.map(
        (m: TrackMatch) => `${m.suggestion.title} by ${m.suggestion.artist}`
      )
      const refinementContext = `Current playlist:\n${currentTracks.join('\n')}\n\nRefinement request: ${request.refinementPrompt}`

      const aiService = new AIService(
        anthropicKey ?? undefined,
        openaiKey ?? undefined,
        openaiBaseUrl ?? undefined
      )
      const aiResponse = await aiService.generatePlaylist({
        prompt: refinementContext,
        favoriteArtists,
        provider: request.provider ?? aiProvider,
        customSystemPrompt: customSystemPrompt ?? undefined,
        temperature
      })

      const matches: TrackMatch[] = await Promise.all(
        aiResponse.tracks.map(suggestion => matchTrack(suggestion, maClient))
      )

      maClient.disconnect()

      const response: RefinePlaylistResponse = {
        success: true,
        matches,
        totalSuggested: matches.length,
        totalMatched: matches.filter(m => m.matched).length
      }
      return response
    })

    if (err !== undefined) {
      res.status(500).json({
        error: 'Failed to refine playlist',
        details: err.message
      })
      return
    }

    res.json(result)
  })
}
