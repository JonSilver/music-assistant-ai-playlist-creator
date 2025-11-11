/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { GetSettingsResponse, UpdateSettingsRequest } from '@shared/types'
import { api } from '../services/api'

interface AppContextType {
  settings: GetSettingsResponse | null
  loading: boolean
  error: string | null
  updateSettings: (updates: UpdateSettingsRequest) => Promise<Error | undefined>
  refreshSettings: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [settings, setSettings] = useState<GetSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    const [err, result] = await api.getSettings()

    if (err !== undefined) {
      setError(err.message)
    } else {
      setSettings(result)
    }

    setLoading(false)
  }

  const updateSettings = async (updates: UpdateSettingsRequest): Promise<Error | undefined> => {
    const [err] = await api.updateSettings(updates)

    if (err !== undefined) {
      setError(err.message)
      return err
    }

    await refreshSettings()
    return undefined
  }

  useEffect(() => {
    void refreshSettings()
  }, [])

  return (
    <AppContext.Provider value={{ settings, loading, error, updateSettings, refreshSettings }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const useSettings = (): { settings: GetSettingsResponse } => {
  const { settings } = useApp()
  return {
    settings: settings ?? {
      musicAssistantUrl: '',
      aiProvider: 'claude',
      hasAnthropicKey: false,
      hasOpenAIKey: false
    }
  }
}
