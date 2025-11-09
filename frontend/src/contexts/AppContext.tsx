import { useState, useEffect, type ReactNode } from 'react'
import type { GetSettingsResponse, UpdateSettingsRequest } from '@shared/types'
import { api } from '../services/api'
import type { Result } from '../utils/safeAttempt'
import { AppContext } from './createAppContext'

export type { AppContextType } from './createAppContext'
export { AppContext } from './createAppContext'

export const AppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [settings, setSettings] = useState<GetSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    const result = await api.getSettings()

    if (result.ok) {
      setSettings(result.value)
    } else {
      setError(result.error.message)
    }

    setLoading(false)
  }

  const updateSettings = async (updates: UpdateSettingsRequest): Promise<Result<void>> => {
    const result = await api.updateSettings(updates)

    if (!result.ok) {
      setError(result.error.message)
      return result
    }

    await refreshSettings()
    return { ok: true, value: undefined }
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
