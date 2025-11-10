import React, { createContext, useState, useCallback } from 'react'
import type { AlertsContextValue } from '../hooks/useAlerts'

// eslint-disable-next-line react-refresh/only-export-components
export const AlertsContext = createContext<AlertsContextValue | null>(null)

export const AlertsProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [error, setErrorState] = useState<string | null>(null)
  const [successMessage, setSuccessState] = useState<string | null>(null)

  const setError = useCallback((message: string): void => {
    setErrorState(message)
    setSuccessState(null)
  }, [])

  const setSuccess = useCallback((message: string): void => {
    setSuccessState(message)
    setErrorState(null)
  }, [])

  const clearError = useCallback((): void => {
    setErrorState(null)
  }, [])

  const clearSuccess = useCallback((): void => {
    setSuccessState(null)
  }, [])

  return (
    <AlertsContext.Provider
      value={{
        error,
        successMessage,
        setError,
        setSuccess,
        clearError,
        clearSuccess
      }}
    >
      {children}
    </AlertsContext.Provider>
  )
}
