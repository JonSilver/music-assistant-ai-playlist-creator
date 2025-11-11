import { useState, useCallback } from 'react'
import { attemptPromise } from '@jfdi/attempt'
import { matchTracksProgressively } from '../services/trackMatching'
import { replaceTrack as replaceTrackService } from '../services/playlistCreator'
import type { TrackMatch, GetSettingsResponse } from '@shared/types'

interface UseTrackReplaceReturn {
  replacingTrackIndex: number | null
  replaceTrack: (index: number) => Promise<void>
}

export const useTrackReplace = (
  generatedTracks: TrackMatch[],
  prompt: string,
  playlistName: string,
  settings: GetSettingsResponse,
  setGeneratedTracks: (tracks: TrackMatch[]) => void,
  setError: (message: string) => void
): UseTrackReplaceReturn => {
  const [replacingTrackIndex, setReplacingTrackIndex] = useState<number | null>(null)

  const replaceTrack = useCallback(
    async (index: number): Promise<void> => {
      const aiProvider = settings.aiProvider
      const apiKey = aiProvider === 'claude' ? settings.anthropicApiKey : settings.openaiApiKey

      if (apiKey.trim().length === 0) {
        setError(`${aiProvider === 'claude' ? 'Anthropic' : 'OpenAI'} API key not configured`)
        return
      }

      const trackToReplace = generatedTracks[index]
      if (trackToReplace === undefined) return

      setReplacingTrackIndex(index)

      const [err, replacementTrack] = await attemptPromise(async () =>
        replaceTrackService(
          trackToReplace,
          prompt,
          playlistName,
          settings.musicAssistantUrl,
          aiProvider,
          apiKey,
          aiProvider === 'claude' ? settings.anthropicModel : settings.openaiModel,
          aiProvider === 'openai' ? settings.openaiBaseUrl : undefined,
          settings.customSystemPrompt,
          settings.temperature
        )
      )

      setReplacingTrackIndex(null)

      if (err !== undefined) {
        setError(`Failed to replace track: ${err.message}`)
        return
      }

      setGeneratedTracks([
        ...generatedTracks.slice(0, index),
        replacementTrack,
        ...generatedTracks.slice(index + 1)
      ])

      void matchTracksProgressively(
        [replacementTrack],
        settings.musicAssistantUrl,
        updater => {
          setGeneratedTracks([
            ...generatedTracks.slice(0, index),
            updater([replacementTrack])[0] ?? replacementTrack,
            ...generatedTracks.slice(index + 1)
          ])
        },
        setError
      )
    },
    [generatedTracks, prompt, playlistName, settings, setError, setGeneratedTracks]
  )

  return { replacingTrackIndex, replaceTrack }
}
