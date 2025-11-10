import React, { createContext, useContext, useState, useCallback } from 'react'

interface AlertsContextValue {
  error: string | null
  successMessage: string | null
  setError: (message: string) => void
  setSuccess: (message: string) => void
  clearError: () => void
  clearSuccess: () => void
}

const AlertsContext = createContext<AlertsContextValue | null>(null)

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

export const useAlerts = (): AlertsContextValue => {
  const context = useContext(AlertsContext)
  if (context === null) {
    throw new Error('useAlerts must be used within AlertsProvider')
  }
  return context
}
