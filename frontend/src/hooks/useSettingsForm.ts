import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useAlerts } from './useAlerts'
import type { AppSettings } from '../../../shared/types'

interface TestResult {
  success: boolean
  error?: string
}

interface UseSettingsFormReturn {
  musicAssistantUrl: string
  setMusicAssistantUrl: (value: string) => void
  aiProvider: 'claude' | 'openai'
  setAiProvider: (value: 'claude' | 'openai') => void
  anthropicApiKey: string
  setAnthropicApiKey: (value: string) => void
  openaiApiKey: string
  setOpenaiApiKey: (value: string) => void
  openaiBaseUrl: string
  setOpenaiBaseUrl: (value: string) => void
  customSystemPrompt: string
  setCustomSystemPrompt: (value: string) => void
  temperature: string
  setTemperature: (value: string) => void
  testingMA: boolean
  testingAnthropic: boolean
  testingOpenAI: boolean
  testResults: {
    ma?: TestResult
    anthropic?: TestResult
    openai?: TestResult
  }
  testMA: () => Promise<void>
  testAnthropic: () => Promise<void>
  testOpenAI: () => Promise<void>
}

export const useSettingsForm = (settings: AppSettings | null): UseSettingsFormReturn => {
  const { setError } = useAlerts()
  const [musicAssistantUrl, setMusicAssistantUrl] = useState('')
  const [aiProvider, setAiProvider] = useState<'claude' | 'openai'>('claude')
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  const [customSystemPrompt, setCustomSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState('1.0')
  const [testingMA, setTestingMA] = useState(false)
  const [testingAnthropic, setTestingAnthropic] = useState(false)
  const [testingOpenAI, setTestingOpenAI] = useState(false)
  const [testResults, setTestResults] = useState<{
    ma?: TestResult
    anthropic?: TestResult
    openai?: TestResult
  }>({})

  useEffect(() => {
    if (settings !== null) {
      setMusicAssistantUrl(settings.musicAssistantUrl)
      setAiProvider(settings.aiProvider)
      setAnthropicApiKey(settings.anthropicApiKey ?? '')
      setOpenaiApiKey(settings.openaiApiKey ?? '')
      setOpenaiBaseUrl(settings.openaiBaseUrl ?? '')
      setCustomSystemPrompt(settings.customSystemPrompt ?? '')
      setTemperature(settings.temperature?.toString() ?? '1.0')
    }
  }, [settings])

  const testMA = useCallback(async (): Promise<void> => {
    if (musicAssistantUrl.trim().length === 0) {
      setError('Please enter a Music Assistant URL')
      return
    }

    setTestingMA(true)
    setTestResults(prev => ({ ...prev, ma: undefined }))

    const [err, result] = await api.testMusicAssistant(musicAssistantUrl.trim())
    setTestingMA(false)

    if (err !== undefined) {
      setTestResults(prev => ({ ...prev, ma: { success: false, error: err.message } }))
    } else {
      setTestResults(prev => ({ ...prev, ma: result }))
    }
  }, [musicAssistantUrl, setError])

  const testAnthropic = useCallback(async (): Promise<void> => {
    if (anthropicApiKey.trim().length === 0) {
      setError('Please enter an Anthropic API key')
      return
    }

    setTestingAnthropic(true)
    setTestResults(prev => ({ ...prev, anthropic: undefined }))

    const [err, result] = await api.testAnthropic(anthropicApiKey.trim())
    setTestingAnthropic(false)

    if (err !== undefined) {
      setTestResults(prev => ({ ...prev, anthropic: { success: false, error: err.message } }))
    } else {
      setTestResults(prev => ({ ...prev, anthropic: result }))
    }
  }, [anthropicApiKey, setError])

  const testOpenAI = useCallback(async (): Promise<void> => {
    if (openaiApiKey.trim().length === 0) {
      setError('Please enter an OpenAI API key')
      return
    }

    setTestingOpenAI(true)
    setTestResults(prev => ({ ...prev, openai: undefined }))

    const [err, result] = await api.testOpenAI(
      openaiApiKey.trim(),
      openaiBaseUrl.trim().length > 0 ? openaiBaseUrl.trim() : undefined
    )
    setTestingOpenAI(false)

    if (err !== undefined) {
      setTestResults(prev => ({ ...prev, openai: { success: false, error: err.message } }))
    } else {
      setTestResults(prev => ({ ...prev, openai: result }))
    }
  }, [openaiApiKey, openaiBaseUrl, setError])

  return {
    musicAssistantUrl,
    setMusicAssistantUrl,
    aiProvider,
    setAiProvider,
    anthropicApiKey,
    setAnthropicApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    openaiBaseUrl,
    setOpenaiBaseUrl,
    customSystemPrompt,
    setCustomSystemPrompt,
    temperature,
    setTemperature,
    testingMA,
    testingAnthropic,
    testingOpenAI,
    testResults,
    testMA,
    testAnthropic,
    testOpenAI
  }
}
