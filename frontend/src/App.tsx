import { useState, useEffect } from 'react'
import { useApp } from './contexts/AppContext'
import { api } from './services/api'
import type {
  CreatePlaylistRequest,
  PromptHistory,
  PresetPrompt,
  TrackMatch
} from '../../shared/types'

const App = (): JSX.Element => {
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

  // Form state for settings
  const [musicAssistantUrl, setMusicAssistantUrl] = useState('')
  const [aiProvider, setAiProvider] = useState<'claude' | 'openai'>('claude')
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')

  useEffect(() => {
    void loadHistory()
    void loadPresets()
  }, [])

  useEffect(() => {
    if (settings !== null) {
      setMusicAssistantUrl(settings.musicAssistantUrl ?? '')
      setAiProvider(settings.aiProvider)
      setAnthropicApiKey(settings.anthropicApiKey ?? '')
      setOpenaiApiKey(settings.openaiApiKey ?? '')
      setOpenaiBaseUrl(settings.openaiBaseUrl ?? '')
    }
  }, [settings])

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

    setGeneratedTracks(result.tracks)
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
      openaiBaseUrl: openaiBaseUrl.length > 0 ? openaiBaseUrl : undefined
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
    if (item.playlistName !== null) {
      setPlaylistName(item.playlistName)
    }
    setShowHistory(false)
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  const hasMatchedTracks = generatedTracks.filter(t => t.matched).length > 0

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
                disabled={generating || prompt.trim().length === 0 || playlistName.trim().length === 0}
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
              <h2 className="card-title">Generated Tracks ({generatedTracks.length})</h2>

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
                    {generatedTracks.map((track, index) => (
                      <tr key={index} className={track.matched ? '' : 'opacity-50'}>
                        <td>{track.suggestion.title}</td>
                        <td>{track.suggestion.artist}</td>
                        <td>{track.suggestion.album ?? '-'}</td>
                        <td>
                          {track.matched ? (
                            <span className="badge badge-success">Found</span>
                          ) : (
                            <span className="badge badge-error">Not Found</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              handleRemoveTrack(index)
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
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
              </>
            )}

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
                          {new Date(item.createdAt).toLocaleDateString()}
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
    </div>
  )
}

export default App
