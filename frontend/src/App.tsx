import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from './contexts/AppContext'
import { api } from './services/api'
import type {
  CreatePlaylistRequest,
  RefinePlaylistRequest,
  PromptHistory,
  PresetPrompt,
  TrackMatch
} from '../../shared/types'
import { Navbar } from './components/Navbar'
import { AlertMessage } from './components/AlertMessage'
import { PresetPrompts } from './components/PresetPrompts'
import { PlaylistCreatorForm } from './components/PlaylistCreatorForm'
import { GeneratedTracksDisplay } from './components/GeneratedTracksDisplay'
import { SettingsModal } from './components/SettingsModal'
import { HistoryModal } from './components/HistoryModal'
import { RefinePlaylistModal } from './components/RefinePlaylistModal'

const App = (): React.JSX.Element => {
  const { settings, updateSettings, loading: settingsLoading } = useApp()
  const [prompt, setPrompt] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generatedTracks, setGeneratedTracks] = useState<TrackMatch[]>([])
  const [history, setHistory] = useState<PromptHistory[]>([])
  const [presets, setPresets] = useState<PresetPrompt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [refining, setRefining] = useState(false)
  const [trackFilter, setTrackFilter] = useState<'all' | 'matched' | 'unmatched'>('all')

  // Form state for settings
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
    ma?: { success: boolean; error?: string }
    anthropic?: { success: boolean; error?: string }
    openai?: { success: boolean; error?: string }
  }>({})

  const loadHistory = useCallback(async (): Promise<void> => {
    const [err, result] = await api.getPromptHistory()
    if (err !== undefined) {
      setError(`Failed to load history: ${err.message}`)
      return
    }
    setHistory(result.history)
  }, [])

  const loadPresets = useCallback(async (): Promise<void> => {
    const [err, result] = await api.getPresetPrompts()
    if (err !== undefined) {
      setError(`Failed to load presets: ${err.message}`)
      return
    }
    setPresets(result.presets)
  }, [])

  useEffect(() => {
    void loadHistory()
    void loadPresets()
  }, [loadHistory, loadPresets])

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

  const handleGeneratePlaylist = async (): Promise<void> => {
    if (prompt.trim().length === 0 || playlistName.trim().length === 0) {
      setError('Please provide both a prompt and playlist name')
      return
    }

    setGenerating(true)
    setError(null)

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
    void loadHistory()
  }

  const handleCreatePlaylist = async (): Promise<void> => {
    if (generatedTracks.length === 0) {
      setError('No tracks to create playlist from')
      return
    }

    setCreating(true)
    setError(null)

    const [err, result] = await api.createPlaylist({
      playlistName: playlistName.trim(),
      tracks: generatedTracks
    })

    setCreating(false)

    if (err !== undefined) {
      setError(`Failed to create playlist: ${err.message}`)
      return
    }

    setSuccessMessage(
      `Playlist created successfully! Added ${result.tracksAdded.toString()} tracks.`
    )
    setPrompt('')
    setPlaylistName('')
    setGeneratedTracks([])
  }

  const handleRemoveTrack = (index: number): void => {
    setGeneratedTracks(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveSettings = async (): Promise<void> => {
    const err = await updateSettings({
      musicAssistantUrl: musicAssistantUrl.length > 0 ? musicAssistantUrl : undefined,
      aiProvider,
      anthropicApiKey: anthropicApiKey.length > 0 ? anthropicApiKey : undefined,
      openaiApiKey: openaiApiKey.length > 0 ? openaiApiKey : undefined,
      openaiBaseUrl: openaiBaseUrl.length > 0 ? openaiBaseUrl : undefined,
      customSystemPrompt: customSystemPrompt.length > 0 ? customSystemPrompt : undefined,
      temperature: temperature.length > 0 ? parseFloat(temperature) : undefined
    })

    if (err !== undefined) {
      setError(`Failed to save settings: ${err.message}`)
      return
    }

    setShowSettings(false)
  }

  const handleUsePreset = (preset: PresetPrompt): void => {
    setPrompt(preset.prompt)
  }

  const handleUseHistory = (item: PromptHistory): void => {
    setPrompt(item.prompt)
    if (item.playlistName !== undefined) {
      setPlaylistName(item.playlistName)
    }
    setShowHistory(false)
  }

  const handleTestMA = async (): Promise<void> => {
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
  }

  const handleTestAnthropic = async (): Promise<void> => {
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
  }

  const handleTestOpenAI = async (): Promise<void> => {
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
  }

  const handleRefinePlaylist = async (): Promise<void> => {
    if (refinementPrompt.trim().length === 0) {
      setError('Please provide refinement instructions')
      return
    }

    setRefining(true)
    setError(null)

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
    setShowRefine(false)
    setSuccessMessage(`Playlist refined! ${result.totalMatched.toString()} tracks matched.`)
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar
        onShowHistory={() => {
          setShowHistory(true)
        }}
        onShowSettings={() => {
          setShowSettings(true)
        }}
      />

      <div className="container mx-auto p-4 max-w-6xl">
        {error !== null && (
          <AlertMessage type="error" message={error} onDismiss={() => setError(null)} />
        )}

        {successMessage !== null && (
          <AlertMessage
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        <PresetPrompts presets={presets} onSelectPreset={handleUsePreset} />

        <PlaylistCreatorForm
          playlistName={playlistName}
          prompt={prompt}
          generating={generating}
          onPlaylistNameChange={setPlaylistName}
          onPromptChange={setPrompt}
          onGenerate={() => {
            void handleGeneratePlaylist()
          }}
        />

        {generatedTracks.length > 0 && (
          <GeneratedTracksDisplay
            tracks={generatedTracks}
            creating={creating}
            trackFilter={trackFilter}
            onTrackFilterChange={setTrackFilter}
            onRemoveTrack={handleRemoveTrack}
            onClear={() => {
              setGeneratedTracks([])
            }}
            onRefine={() => {
              setShowRefine(true)
            }}
            onCreate={() => {
              void handleCreatePlaylist()
            }}
          />
        )}
      </div>

      <SettingsModal
        show={showSettings}
        onClose={() => {
          setShowSettings(false)
        }}
        musicAssistantUrl={musicAssistantUrl}
        onMusicAssistantUrlChange={setMusicAssistantUrl}
        aiProvider={aiProvider}
        onAiProviderChange={setAiProvider}
        anthropicApiKey={anthropicApiKey}
        onAnthropicApiKeyChange={setAnthropicApiKey}
        openaiApiKey={openaiApiKey}
        onOpenaiApiKeyChange={setOpenaiApiKey}
        openaiBaseUrl={openaiBaseUrl}
        onOpenaiBaseUrlChange={setOpenaiBaseUrl}
        customSystemPrompt={customSystemPrompt}
        onCustomSystemPromptChange={setCustomSystemPrompt}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        testingMA={testingMA}
        testingAnthropic={testingAnthropic}
        testingOpenAI={testingOpenAI}
        testResults={testResults}
        onTestMA={() => {
          void handleTestMA()
        }}
        onTestAnthropic={() => {
          void handleTestAnthropic()
        }}
        onTestOpenAI={() => {
          void handleTestOpenAI()
        }}
        onSave={() => {
          void handleSaveSettings()
        }}
      />

      <HistoryModal
        show={showHistory}
        onClose={() => {
          setShowHistory(false)
        }}
        history={history}
        onSelectHistory={handleUseHistory}
      />

      <RefinePlaylistModal
        show={showRefine}
        onClose={() => {
          setShowRefine(false)
        }}
        refinementPrompt={refinementPrompt}
        onRefinementPromptChange={setRefinementPrompt}
        refining={refining}
        onRefine={() => {
          void handleRefinePlaylist()
        }}
      />
    </div>
  )
}

export default App
