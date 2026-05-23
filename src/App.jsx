import { BrowserRouter } from 'react-router-dom'

import AppRoutes     from './routes/AppRoutes'
import ErrorBoundary from './components/ErrorBoundary'
import Toast         from './components/ui/Toast'
import { useApp }    from './context/AppContext'

/**
 * App is now a thin shell:
 *  - <BrowserRouter> at the top
 *  - <ErrorBoundary> catches render-time crashes anywhere below
 *  - <AppRoutes> handles auth gating, public vs protected layouts, the works
 *  - <GlobalToast> mounts the toast once at the root so it works on
 *    public routes too (previously it was duplicated in AppShell and
 *    PublicArea and would unmount when crossing the auth boundary).
 */
function GlobalToast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null
  return <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
        <GlobalToast />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
