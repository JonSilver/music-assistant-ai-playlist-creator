import React, { useState, useEffect } from 'react'
import { useApp } from './contexts/AppContext'
import { api } from './services/api'
import type {
  CreatePlaylistRequest,
  RefinePlaylistRequest,
  PromptHistory,
  PresetPrompt,
  TrackMatch
} from '../../shared/types'

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

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      const [err, result] = await api.getPromptHistory()
      if (err !== undefined) {
        setError(`Failed to load history: ${err.message}`)
        return
      }
      setHistory(result.history)
    }

    const loadPresets = async (): Promise<void> => {
      const [err, result] = await api.getPresetPrompts()
      if (err !== undefined) {
        setError(`Failed to load presets: ${err.message}`)
        return
      }
      setPresets(result.presets)
    }

    void loadHistory()
    void loadPresets()
  }, [])

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

  const hasMatchedTracks = generatedTracks.filter(t => t.matched).length > 0
  const matchedCount = generatedTracks.filter(t => t.matched).length
  const totalCount = generatedTracks.length
  const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0

  const filteredTracks = generatedTracks.filter(track => {
    if (trackFilter === 'matched') return track.matched
    if (trackFilter === 'unmatched') return !track.matched
    return true
  })

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">AI Playlist Creator</a>
        </div>
        <div className="flex-none gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => {
              setShowHistory(true)
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-5 h-5 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            History
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setShowSettings(true)
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-5 h-5 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 max-w-6xl">
        {error !== null && (
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setError(null)
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage !== null && (
          <div className="alert alert-success mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setSuccessMessage(null)
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Preset Prompts */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">Quick Presets</h2>
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    handleUsePreset(preset)
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Playlist Creator Form */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">Create Playlist</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Playlist Name</span>
              </label>
              <input
                type="text"
                placeholder="My Awesome Playlist"
                className="input input-bordered"
                value={playlistName}
                onChange={e => {
                  setPlaylistName(e.target.value)
                }}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Describe your playlist</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="e.g., Upbeat workout music with rock and electronic tracks"
                value={prompt}
                onChange={e => {
                  setPrompt(e.target.value)
                }}
              ></textarea>
            </div>

            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={() => {
                  void handleGeneratePlaylist()
                }}
                disabled={
                  generating || prompt.trim().length === 0 || playlistName.trim().length === 0
                }
              >
                {generating && <span className="loading loading-spinner"></span>}
                {generating ? 'Generating...' : 'Generate Playlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Tracks */}
        {generatedTracks.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="card-title mb-2">Generated Tracks</h2>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-semibold">{matchedCount}</span> of{' '}
                      <span className="font-semibold">{totalCount}</span> tracks found in your
                      library
                      {matchPercentage > 0 && (
                        <span className="ml-2 badge badge-sm badge-info">{matchPercentage}%</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="btn-group">
                  <button
                    className={`btn btn-sm ${trackFilter === 'all' ? 'btn-active' : ''}`}
                    onClick={() => {
                      setTrackFilter('all')
                    }}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    className={`btn btn-sm ${trackFilter === 'matched' ? 'btn-active' : ''}`}
                    onClick={() => {
                      setTrackFilter('matched')
                    }}
                  >
                    Found ({matchedCount})
                  </button>
                  <button
                    className={`btn btn-sm ${trackFilter === 'unmatched' ? 'btn-active' : ''}`}
                    onClick={() => {
                      setTrackFilter('unmatched')
                    }}
                  >
                    Not Found ({totalCount - matchedCount})
                  </button>
                </div>
              </div>

              {matchPercentage < 100 && matchPercentage > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Match Rate</span>
                    <span>{matchPercentage}%</span>
                  </div>
                  <progress
                    className="progress progress-success w-full"
                    value={matchPercentage}
                    max="100"
                  ></progress>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Album</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 opacity-50">
                          No tracks match the current filter
                        </td>
                      </tr>
                    ) : (
                      filteredTracks.map(track => {
                        const actualIndex = generatedTracks.indexOf(track)
                        return (
                          <tr key={actualIndex} className={track.matched ? '' : 'opacity-50'}>
                            <td>
                              <div className="font-medium">{track.suggestion.title}</div>
                              {track.maTrack !== undefined && (
                                <div className="text-xs opacity-60">{track.maTrack.provider}</div>
                              )}
                            </td>
                            <td>{track.suggestion.artist}</td>
                            <td>{track.suggestion.album ?? '-'}</td>
                            <td>
                              {track.matched ? (
                                <span className="badge badge-success gap-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    className="inline-block w-4 h-4 stroke-current"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    ></path>
                                  </svg>
                                  Found
                                </span>
                              ) : (
                                <span className="badge badge-error gap-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    className="inline-block w-4 h-4 stroke-current"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                  </svg>
                                  Not Found
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => {
                                  handleRemoveTrack(actualIndex)
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setGeneratedTracks([])
                  }}
                >
                  Clear
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRefine(true)
                  }}
                >
                  Refine Playlist
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    void handleCreatePlaylist()
                  }}
                  disabled={creating || !hasMatchedTracks}
                >
                  {creating && <span className="loading loading-spinner"></span>}
                  {creating ? 'Creating...' : 'Create Playlist in Music Assistant'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Settings</h3>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Music Assistant URL</span>
              </label>
              <input
                type="text"
                placeholder="http://192.168.1.100:8095"
                className="input input-bordered"
                value={musicAssistantUrl}
                onChange={e => {
                  setMusicAssistantUrl(e.target.value)
                }}
              />
              <label className="label">
                <span className="label-text-alt">WebSocket URL of your Music Assistant server</span>
              </label>
              <button
                className="btn btn-sm btn-outline mt-2"
                onClick={() => {
                  void handleTestMA()
                }}
                disabled={testingMA || musicAssistantUrl.trim().length === 0}
              >
                {testingMA && <span className="loading loading-spinner loading-xs"></span>}
                {testingMA ? 'Testing...' : 'Test Connection'}
              </button>
              {testResults.ma !== undefined && (
                <div
                  className={`alert ${testResults.ma.success ? 'alert-success' : 'alert-error'} mt-2`}
                >
                  <span className="text-sm">
                    {testResults.ma.success
                      ? 'Connection successful!'
                      : `Connection failed: ${testResults.ma.error ?? 'Unknown error'}`}
                  </span>
                </div>
              )}
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">AI Provider</span>
              </label>
              <select
                className="select select-bordered"
                value={aiProvider}
                onChange={e => {
                  setAiProvider(e.target.value as 'claude' | 'openai')
                }}
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            {aiProvider === 'claude' && (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Anthropic API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="input input-bordered"
                  value={anthropicApiKey}
                  onChange={e => {
                    setAnthropicApiKey(e.target.value)
                  }}
                />
                <button
                  className="btn btn-sm btn-outline mt-2"
                  onClick={() => {
                    void handleTestAnthropic()
                  }}
                  disabled={testingAnthropic || anthropicApiKey.trim().length === 0}
                >
                  {testingAnthropic && <span className="loading loading-spinner loading-xs"></span>}
                  {testingAnthropic ? 'Testing...' : 'Test API Key'}
                </button>
                {testResults.anthropic !== undefined && (
                  <div
                    className={`alert ${testResults.anthropic.success ? 'alert-success' : 'alert-error'} mt-2`}
                  >
                    <span className="text-sm">
                      {testResults.anthropic.success
                        ? 'API key valid!'
                        : `API key test failed: ${testResults.anthropic.error ?? 'Unknown error'}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {aiProvider === 'openai' && (
              <>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">OpenAI API Key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="input input-bordered"
                    value={openaiApiKey}
                    onChange={e => {
                      setOpenaiApiKey(e.target.value)
                    }}
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">OpenAI Base URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    className="input input-bordered"
                    value={openaiBaseUrl}
                    onChange={e => {
                      setOpenaiBaseUrl(e.target.value)
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">For OpenAI-compatible endpoints</span>
                  </label>
                </div>

                <button
                  className="btn btn-sm btn-outline mb-4"
                  onClick={() => {
                    void handleTestOpenAI()
                  }}
                  disabled={testingOpenAI || openaiApiKey.trim().length === 0}
                >
                  {testingOpenAI && <span className="loading loading-spinner loading-xs"></span>}
                  {testingOpenAI ? 'Testing...' : 'Test API Key'}
                </button>
                {testResults.openai !== undefined && (
                  <div
                    className={`alert ${testResults.openai.success ? 'alert-success' : 'alert-error'} mb-4`}
                  >
                    <span className="text-sm">
                      {testResults.openai.success
                        ? 'API key valid!'
                        : `API key test failed: ${testResults.openai.error ?? 'Unknown error'}`}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="divider"></div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Temperature</span>
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                placeholder="1.0"
                className="input input-bordered"
                value={temperature}
                onChange={e => {
                  setTemperature(e.target.value)
                }}
              />
              <label className="label">
                <span className="label-text-alt">
                  Controls randomness (0 = focused, 2 = creative). Default: 1.0
                </span>
              </label>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Custom System Prompt (Optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Override the default AI system prompt. Leave empty to use default."
                value={customSystemPrompt}
                onChange={e => {
                  setCustomSystemPrompt(e.target.value)
                }}
              ></textarea>
              <label className="label">
                <span className="label-text-alt">
                  Customize how the AI curates playlists. Must return JSON format.
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowSettings(false)
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  void handleSaveSettings()
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Prompt History</h3>

            {history.length === 0 ? (
              <p className="text-center py-8 text-base-content/50">
                No history yet. Create your first playlist!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="card bg-base-200 cursor-pointer hover:bg-base-300"
                    onClick={() => {
                      handleUseHistory(item)
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{item.playlistName ?? 'Untitled'}</p>
                          <p className="text-sm opacity-75 mt-1">{item.prompt}</p>
                        </div>
                        <div className="text-xs opacity-50 ml-4">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs opacity-50">{item.trackCount} tracks</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowHistory(false)
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refine Playlist Modal */}
      {showRefine && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Refine Playlist</h3>

            <p className="text-sm opacity-75 mb-4">
              Describe how you want to modify the current playlist. The AI will generate a new
              version based on your refinement instructions.
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Refinement Instructions</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="e.g., Add more upbeat tracks, Remove anything slower than 120 BPM, Include more Beatles songs, Make it more energetic"
                value={refinementPrompt}
                onChange={e => {
                  setRefinementPrompt(e.target.value)
                }}
              ></textarea>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowRefine(false)
                  setRefinementPrompt('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  void handleRefinePlaylist()
                }}
                disabled={refining || refinementPrompt.trim().length === 0}
              >
                {refining && <span className="loading loading-spinner"></span>}
                {refining ? 'Refining...' : 'Refine Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
