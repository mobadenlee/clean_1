import { createContext, useContext, useState, useCallback } from 'react'

// AppContext is intentionally lean — only UI state lives here.
// All data (issues, notifications, saved issues) lives in React Query hooks.

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null) // { message, type }

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <AppContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
