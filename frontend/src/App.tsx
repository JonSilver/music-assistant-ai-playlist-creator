import React, { useEffect, useCallback } from 'react'
import { useApp } from './contexts/AppContext'
import { useAlerts } from './hooks/useAlerts'
import { usePlaylist } from './hooks/usePlaylist'
import { useSettingsForm } from './hooks/useSettingsForm'
import { useHistoryAndPresets } from './hooks/useHistoryAndPresets'
import { useModals } from './hooks/useModals'
import type { PromptHistory, PresetPrompt } from '../../shared/types'
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
  const { error, successMessage, setError, clearError, clearSuccess } = useAlerts()
  const historyAndPresetsResult = useHistoryAndPresets()
  const {
    showSettings,
    showHistory,
    showRefine,
    openSettings,
    closeSettings,
    openHistory,
    closeHistory,
    openRefine,
    closeRefine
  } = useModals()

  const { history, presets, loadHistory, loadPresets } = historyAndPresetsResult

  const playlist = usePlaylist(() => {
    void loadHistory()
  })
  const settingsForm = useSettingsForm(settings)

  useEffect(() => {
    void loadHistory()
    void loadPresets()
  }, [loadHistory, loadPresets])

  const handleSaveSettings = useCallback(async (): Promise<void> => {
    const err = await updateSettings({
      musicAssistantUrl:
        settingsForm.musicAssistantUrl.length > 0 ? settingsForm.musicAssistantUrl : undefined,
      aiProvider: settingsForm.aiProvider,
      anthropicApiKey:
        settingsForm.anthropicApiKey.length > 0 ? settingsForm.anthropicApiKey : undefined,
      openaiApiKey: settingsForm.openaiApiKey.length > 0 ? settingsForm.openaiApiKey : undefined,
      openaiBaseUrl: settingsForm.openaiBaseUrl.length > 0 ? settingsForm.openaiBaseUrl : undefined,
      customSystemPrompt:
        settingsForm.customSystemPrompt.length > 0 ? settingsForm.customSystemPrompt : undefined,
      temperature:
        settingsForm.temperature.length > 0 ? parseFloat(settingsForm.temperature) : undefined
    })

    if (err !== undefined) {
      setError(`Failed to save settings: ${err.message}`)
      return
    }

    closeSettings()
  }, [settingsForm, updateSettings, setError, closeSettings])

  const handleUsePreset = useCallback(
    (preset: PresetPrompt): void => {
      playlist.setPrompt(preset.prompt)
    },
    [playlist]
  )

  const handleUseHistory = useCallback(
    (item: PromptHistory): void => {
      playlist.setPrompt(item.prompt)
      if (item.playlistName !== undefined) {
        playlist.setPlaylistName(item.playlistName)
      }
      closeHistory()
    },
    [playlist, closeHistory]
  )

  const handleRefineComplete = useCallback((): void => {
    closeRefine()
  }, [closeRefine])

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar onShowHistory={openHistory} onShowSettings={openSettings} />

      <div className="container mx-auto p-4 max-w-6xl">
        {error !== null && <AlertMessage type="error" message={error} onDismiss={clearError} />}
        {successMessage !== null && (
          <AlertMessage type="success" message={successMessage} onDismiss={clearSuccess} />
        )}

        <PresetPrompts presets={presets} onSelectPreset={handleUsePreset} />

        <PlaylistCreatorForm
          playlistName={playlist.playlistName}
          prompt={playlist.prompt}
          generating={playlist.generating}
          onPlaylistNameChange={playlist.setPlaylistName}
          onPromptChange={playlist.setPrompt}
          onGenerate={() => {
            void playlist.generatePlaylist()
          }}
        />

        {playlist.generatedTracks.length > 0 && (
          <GeneratedTracksDisplay
            tracks={playlist.generatedTracks}
            creating={playlist.creating}
            trackFilter={playlist.trackFilter}
            onTrackFilterChange={playlist.setTrackFilter}
            onRemoveTrack={playlist.removeTrack}
            onClear={playlist.clearTracks}
            onRefine={openRefine}
            onCreate={() => {
              void playlist.createPlaylist()
            }}
          />
        )}
      </div>

      <SettingsModal
        show={showSettings}
        onClose={closeSettings}
        {...settingsForm}
        onSave={() => {
          void handleSaveSettings()
        }}
      />

      <HistoryModal
        show={showHistory}
        onClose={closeHistory}
        history={history}
        onSelectHistory={handleUseHistory}
      />

      <RefinePlaylistModal
        show={showRefine}
        onClose={() => {
          closeRefine()
          playlist.setRefinementPrompt('')
        }}
        refinementPrompt={playlist.refinementPrompt}
        onRefinementPromptChange={playlist.setRefinementPrompt}
        refining={playlist.refining}
        onRefine={() => {
          void playlist.refinePlaylist().then(handleRefineComplete)
        }}
      />
    </div>
  )
}

export default App
