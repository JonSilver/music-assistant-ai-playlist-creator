import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { attempt } from '@jfdi/attempt'
import type { GetSettingsResponse, UpdateSettingsRequest } from '@shared/types'
import { api } from '../services/api'

interface AppContextType {
  settings: GetSettingsResponse | null
  loading: boolean
  error: string | null
  updateSettings: (updates: UpdateSettingsRequest) => Promise<void>
  refreshSettings: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [settings, setSettings] = useState<GetSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    const result = await attempt(async () => api.getSettings())

    if (result.ok) {
      setSettings(result.value)
    } else {
      setError(result.error.message)
    }

    setLoading(false)
  }

  const updateSettings = async (updates: UpdateSettingsRequest): Promise<void> => {
    const result = await attempt(async () => {
      await api.updateSettings(updates)
      await refreshSettings()
    })

    if (!result.ok) {
      setError(result.error.message)
      throw result.error
    }
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
