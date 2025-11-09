import { createContext } from 'react'
import type { GetSettingsResponse, UpdateSettingsRequest } from '@shared/types'
import type { Result } from '../utils/safeAttempt'

export interface AppContextType {
  settings: GetSettingsResponse | null
  loading: boolean
  error: string | null
  updateSettings: (updates: UpdateSettingsRequest) => Promise<Result<void>>
  refreshSettings: () => Promise<void>
}

export const AppContext = createContext<AppContextType | undefined>(undefined)
