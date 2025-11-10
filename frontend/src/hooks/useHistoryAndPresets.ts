import { useState, useCallback } from 'react'
import { api } from '../services/api'
import { useAlerts } from './useAlerts'
import type { PromptHistory, PresetPrompt } from '../../../shared/types'

interface UseHistoryAndPresetsReturn {
  history: PromptHistory[]
  presets: PresetPrompt[]
  loadHistory: () => Promise<void>
  loadPresets: () => Promise<void>
}

export const useHistoryAndPresets = (): UseHistoryAndPresetsReturn => {
  const { setError } = useAlerts()
  const [history, setHistory] = useState<PromptHistory[]>([])
  const [presets, setPresets] = useState<PresetPrompt[]>([])

  const loadHistory = useCallback(async (): Promise<void> => {
    const [err, result] = await api.getPromptHistory()
    if (err !== undefined) {
      setError(`Failed to load history: ${err.message}`)
      return
    }
    setHistory(result.history)
  }, [setError])

  const loadPresets = useCallback(async (): Promise<void> => {
    const [err, result] = await api.getPresetPrompts()
    if (err !== undefined) {
      setError(`Failed to load presets: ${err.message}`)
      return
    }
    setPresets(result.presets)
  }, [setError])

  return {
    history,
    presets,
    loadHistory,
    loadPresets
  }
}
