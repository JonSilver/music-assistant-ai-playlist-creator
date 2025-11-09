import type { Router, Request, Response } from 'express'
import { attempt } from '@jfdi/attempt'
import { MusicAssistantClient } from '../services/musicAssistant.js'
import { AIService } from '../services/ai.js'
import type { PlaylistDatabase } from '../db/schema.js'
import type {
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  RefinePlaylistRequest,
  TrackMatch,
  TrackSuggestion
} from '../../../shared/types.js'

const matchTrack = (suggestion: TrackSuggestion, libraryTracks: Array<{ name: string; artists: Array<{ name: string }>; album?: { name: string }; uri: string; provider: string; item_id: string }>): TrackMatch => {
  // Simple fuzzy matching based on track title and artist
  const suggestedTitle = suggestion.title.toLowerCase()
  const suggestedArtist = suggestion.artist.toLowerCase()

  for (const track of libraryTracks) {
    const trackTitle = track.name.toLowerCase()
    const trackArtists = track.artists.map(a => a.name.toLowerCase())

    // Check if title matches (allowing some flexibility)
    const titleMatch = trackTitle.includes(suggestedTitle) || suggestedTitle.includes(trackTitle)

    // Check if artist matches
    const artistMatch = trackArtists.some(
      artist => artist.includes(suggestedArtist) || suggestedArtist.includes(artist)
    )

    if (titleMatch && artistMatch) {
      return {
        suggestion,
        matched: true,
        maTrack: track,
        confidence: 1.0
      }
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

    const result = await attempt(async () => {
      // Get settings
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiBaseUrl = db.getSetting('openaiBaseUrl')

      if (!maUrl) {
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
        provider: request.provider ?? aiProvider
      })

      // Get library tracks for matching
      const libraryTracks = await maClient.getLibraryTracks()

      // Match AI suggestions to library tracks
      const matches: TrackMatch[] = aiResponse.tracks.map(suggestion =>
        matchTrack(suggestion, libraryTracks)
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

    if (!result.ok) {
      res.status(500).json({
        error: 'Failed to generate playlist',
        details: result.error.message
      })
      return
    }

    res.json(result.value)
  })

  // Create playlist in Music Assistant
  router.post('/playlist/create', async (req: Request, res: Response) => {
    const { playlistName, matches } = req.body as { playlistName: string; matches: TrackMatch[] }

    const result = await attempt(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      if (!maUrl) {
        throw new Error('Music Assistant URL not configured')
      }

      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      // Create playlist
      const playlistId = await maClient.createPlaylist(playlistName)

      // Add matched tracks
      const trackUris = matches
        .filter(m => m.matched && m.maTrack)
        .map(m => m.maTrack!.uri)

      if (trackUris.length > 0) {
        await maClient.addTracksToPlaylist(playlistId, trackUris)
      }

      maClient.disconnect()

      // Save to history
      db.addPromptHistory(
        req.body.prompt as string ?? 'Unknown',
        playlistName,
        trackUris.length
      )

      return { playlistId, trackCount: trackUris.length }
    })

    if (!result.ok) {
      res.status(500).json({
        error: 'Failed to create playlist',
        details: result.error.message
      })
      return
    }

    res.json({ success: true, ...result.value })
  })

  // Refine playlist
  router.post('/playlist/refine', async (req: Request, res: Response) => {
    const request = req.body as RefinePlaylistRequest

    const result = await attempt(async () => {
      const maUrl = db.getSetting('musicAssistantUrl')
      const aiProvider = (db.getSetting('aiProvider') ?? 'claude') as 'claude' | 'openai'
      const anthropicKey = db.getSetting('anthropicApiKey')
      const openaiKey = db.getSetting('openaiApiKey')
      const openaiBaseUrl = db.getSetting('openaiBaseUrl')

      if (!maUrl) {
        throw new Error('Music Assistant URL not configured')
      }

      const maClient = new MusicAssistantClient(maUrl)
      await maClient.connect()

      const favoriteArtists = await maClient.getFavoriteArtists()

      // Build refinement prompt
      const currentTracks = request.currentTracks.map(m => `${m.suggestion.title} by ${m.suggestion.artist}`)
      const refinementContext = `Current playlist:\n${currentTracks.join('\n')}\n\nRefinement request: ${request.refinementPrompt}`

      const aiService = new AIService(
        anthropicKey ?? undefined,
        openaiKey ?? undefined,
        openaiBaseUrl ?? undefined
      )
      const aiResponse = await aiService.generatePlaylist({
        prompt: refinementContext,
        favoriteArtists,
        provider: request.provider ?? aiProvider
      })

      const libraryTracks = await maClient.getLibraryTracks()
      const matches: TrackMatch[] = aiResponse.tracks.map(suggestion =>
        matchTrack(suggestion, libraryTracks)
      )

      maClient.disconnect()

      return {
        matches,
        totalSuggested: matches.length,
        totalMatched: matches.filter(m => m.matched).length
      }
    })

    if (!result.ok) {
      res.status(500).json({
        error: 'Failed to refine playlist',
        details: result.error.message
      })
      return
    }

    res.json({ success: true, ...result.value })
  })
}
