import type { Router, Request, Response } from 'express'
import { attemptPromise } from '@jfdi/attempt'
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
  // Use Music Assistant's search - it's excellent, trust it
  const searchQuery = `${suggestion.title} ${suggestion.artist}`
  console.log(`Searching for: "${searchQuery}"`)
  const searchResults = await maClient.searchTracks(searchQuery, 5)

  console.log(`Search returned ${searchResults.length} results`)
  if (searchResults.length > 0) {
    const firstTrack = searchResults[0]
    console.log(
      `Matched: "${suggestion.title}" by "${suggestion.artist}" -> "${firstTrack.name}" by "${firstTrack.artists?.[0]?.name || 'unknown'}"`
    )
    return {
      suggestion,
      matched: true,
      maTrack: firstTrack
    }
  }

  console.log(`No match found for: "${suggestion.title}" by "${suggestion.artist}"`)
  return {
    suggestion,
    matched: false
  }
}

export const setupPlaylistRoutes = (router: Router, db: PlaylistDatabase): void => {
  // Generate playlist suggestions (AI only, no matching yet)
  router.post('/playlist/generate', async (req: Request, res: Response) => {
    const request = req.body as CreatePlaylistRequest

    const [err, result] = await attemptPromise(async () => {
      // Get settings
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const anthropicModel = db.getSetting('anthropicModel')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiModel = db.getSetting('openaiModel')
      const openaiBaseUrl = db.getSetting('openaiBaseUrl')
      const customSystemPrompt = db.getSetting('customSystemPrompt')
      const temperatureStr = db.getSetting('temperature')
      const temperature = temperatureStr !== null ? parseFloat(temperatureStr) : undefined

      if (maUrl === null || maUrl.length === 0) {
        throw new Error('Music Assistant URL not configured')
      }

      // Connect to Music Assistant briefly to get favorite artists
      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()
      const favoriteArtists = await maClient.getFavoriteArtists()
      maClient.disconnect()

      // Get AI suggestions
      const aiService = new AIService(
        anthropicKey ?? undefined,
        openaiKey ?? undefined,
        openaiBaseUrl ?? undefined
      )
      // Select model based on provider
      const model =
        (request.provider ?? aiProvider) === 'claude'
          ? (anthropicModel ?? undefined)
          : (openaiModel ?? undefined)

      const aiResponse = await aiService.generatePlaylist({
        prompt: request.prompt,
        favoriteArtists,
        provider: request.provider ?? aiProvider,
        model,
        customSystemPrompt: customSystemPrompt ?? undefined,
        temperature,
        trackCount: request.trackCount
      })

      // Return unmatched tracks immediately with matching state
      const matches: TrackMatch[] = aiResponse.tracks.map(suggestion => ({
        suggestion,
        matched: false,
        matching: true
      }))

      const response: CreatePlaylistResponse = {
        success: true,
        playlistName: request.playlistName ?? 'AI Generated Playlist',
        matches,
        totalSuggested: matches.length,
        totalMatched: 0
      }

      return response
    })

    if (err !== undefined) {
      console.error('Playlist generation error:', err)
      res.status(500).json({
        error: 'Failed to generate playlist',
        details: err.message
      })
      return
    }

    res.json(result)
  })

  // Match a single track
  router.post('/playlist/match-track', async (req: Request, res: Response) => {
    const { suggestion } = req.body as { suggestion: TrackSuggestion }

    const [err, result] = await attemptPromise(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      if (maUrl === null || maUrl.length === 0) {
        throw new Error('Music Assistant URL not configured')
      }

      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      const match = await matchTrack(suggestion, maClient)

      maClient.disconnect()

      return match
    })

    if (err !== undefined) {
      console.error('Track matching error:', err)
      res.status(500).json({
        error: 'Failed to match track',
        details: err.message
      })
      return
    }

    res.json(result)
  })

  // Create playlist in Music Assistant
  router.post('/playlist/create', async (req: Request, res: Response) => {
    const { playlistName, tracks } = req.body as { playlistName: string; tracks: TrackMatch[] }

    const [err, result] = await attemptPromise(async () => {
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

    const [err, result] = await attemptPromise(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const anthropicModel = db.getSetting('anthropicModel')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiModel = db.getSetting('openaiModel')
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

      // Select model based on provider
      const model =
        (request.provider ?? aiProvider) === 'claude'
          ? (anthropicModel ?? undefined)
          : (openaiModel ?? undefined)

      const aiService = new AIService(
        anthropicKey ?? undefined,
        openaiKey ?? undefined,
        openaiBaseUrl ?? undefined
      )
      const aiResponse = await aiService.generatePlaylist({
        prompt: refinementContext,
        favoriteArtists,
        provider: request.provider ?? aiProvider,
        model,
        customSystemPrompt: customSystemPrompt ?? undefined,
        temperature
      })

      maClient.disconnect()

      // Return unmatched tracks immediately - let frontend handle progressive matching
      const matches: TrackMatch[] = aiResponse.tracks.map(suggestion => ({
        suggestion,
        matched: false,
        maTrack: undefined
      }))

      const response: RefinePlaylistResponse = {
        success: true,
        matches,
        totalSuggested: matches.length,
        totalMatched: 0
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
