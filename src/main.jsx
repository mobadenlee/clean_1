import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query'

import './styles/tokens.css'
import './styles/animations.css'
import './styles/globals.css'

import { AuthProvider } from './context/AuthContext'
import { AppProvider }  from './context/AppContext'
import App              from './App'

// Single place to observe every query/mutation failure in the app.
// Per-call onError handlers in hooks still run; this just guarantees
// nothing fails silently. Wire to Sentry/Datadog by replacing console.error.
const logQueryError = (error, queryOrMutation) => {
  const key =
    queryOrMutation?.queryKey ??
    queryOrMutation?.options?.mutationKey ??
    '<unknown>'
  console.error('[query]', key, error?.message ?? error)
}

const queryClient = new QueryClient({
  queryCache:    new QueryCache({    onError: (err, query)    => logQueryError(err, query) }),
  mutationCache: new MutationCache({ onError: (err, _v, _c, mutation) => logQueryError(err, mutation) }),
  defaultOptions: {
    queries: {
      retry:                1,
      refetchOnWindowFocus: false,
      staleTime:            30_000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
