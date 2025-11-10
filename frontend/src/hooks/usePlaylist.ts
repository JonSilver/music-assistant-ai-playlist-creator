import { useState, useCallback } from 'react'
import { api } from '../services/api'
import { useAlerts } from '../contexts/AlertsContext'
import type { TrackMatch, CreatePlaylistRequest, RefinePlaylistRequest } from '../../../shared/types'

interface UsePlaylistReturn {
  prompt: string
  setPrompt: (value: string) => void
  playlistName: string
  setPlaylistName: (value: string) => void
  generating: boolean
  creating: boolean
  refining: boolean
  generatedTracks: TrackMatch[]
  setGeneratedTracks: (tracks: TrackMatch[]) => void
  trackFilter: 'all' | 'matched' | 'unmatched'
  setTrackFilter: (filter: 'all' | 'matched' | 'unmatched') => void
  refinementPrompt: string
  setRefinementPrompt: (value: string) => void
  generatePlaylist: () => Promise<void>
  createPlaylist: () => Promise<void>
  refinePlaylist: () => Promise<void>
  removeTrack: (index: number) => void
  clearTracks: () => void
}

export const usePlaylist = (onHistoryUpdate: () => void): UsePlaylistReturn => {
  const { setError, setSuccess } = useAlerts()
  const [prompt, setPrompt] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [generatedTracks, setGeneratedTracks] = useState<TrackMatch[]>([])
  const [trackFilter, setTrackFilter] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [refinementPrompt, setRefinementPrompt] = useState('')

  const generatePlaylist = useCallback(async (): Promise<void> => {
    if (prompt.trim().length === 0 || playlistName.trim().length === 0) {
      setError('Please provide both a prompt and playlist name')
      return
    }

    setGenerating(true)

    const request: CreatePlaylistRequest = {
      prompt: prompt.trim(),
      playlistName: playlistName.trim()
    }

    const [err, result] = await api.generatePlaylist(request)
    setGenerating(false)

    if (err !== undefined) {
      setError(`Failed to generate playlist: ${err.message}`)
      return
    }

    setGeneratedTracks(result.matches)
    onHistoryUpdate()
  }, [prompt, playlistName, setError, onHistoryUpdate])

  const createPlaylist = useCallback(async (): Promise<void> => {
    if (generatedTracks.length === 0) {
      setError('No tracks to create playlist from')
      return
    }

    setCreating(true)

    const [err, result] = await api.createPlaylist({
      playlistName: playlistName.trim(),
      tracks: generatedTracks
    })

    setCreating(false)

    if (err !== undefined) {
      setError(`Failed to create playlist: ${err.message}`)
      return
    }

    setSuccess(`Playlist created successfully! Added ${result.tracksAdded.toString()} tracks.`)
    setPrompt('')
    setPlaylistName('')
    setGeneratedTracks([])
  }, [generatedTracks, playlistName, setError, setSuccess])

  const refinePlaylist = useCallback(async (): Promise<void> => {
    if (refinementPrompt.trim().length === 0) {
      setError('Please provide refinement instructions')
      return
    }

    setRefining(true)

    const request: RefinePlaylistRequest = {
      originalPrompt: prompt.trim(),
      refinementPrompt: refinementPrompt.trim(),
      currentTracks: generatedTracks
    }

    const [err, result] = await api.refinePlaylist(request)
    setRefining(false)

    if (err !== undefined) {
      setError(`Failed to refine playlist: ${err.message}`)
      return
    }

    setGeneratedTracks(result.matches)
    setRefinementPrompt('')
    setSuccess(`Playlist refined! ${result.totalMatched.toString()} tracks matched.`)
  }, [refinementPrompt, prompt, generatedTracks, setError, setSuccess])

  const removeTrack = useCallback((index: number): void => {
    setGeneratedTracks(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearTracks = useCallback((): void => {
    setGeneratedTracks([])
  }, [])

  return {
    prompt,
    setPrompt,
    playlistName,
    setPlaylistName,
    generating,
    creating,
    refining,
    generatedTracks,
    setGeneratedTracks,
    trackFilter,
    setTrackFilter,
    refinementPrompt,
    setRefinementPrompt,
    generatePlaylist,
    createPlaylist,
    refinePlaylist,
    removeTrack,
    clearTracks
  }
}
