import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Wraps routes that should ONLY be visible when signed out
 * (landing, login, signup). When a session exists, bounces to
 * /dashboard — or back to the page the user originally wanted
 * (location.state.from), if ProtectedRoute redirected them here.
 */
export default function PublicOnlyRoute({ children }) {
  const { isLoading, session } = useAuth()
  const location = useLocation()

  if (isLoading) return (
    <div style={{
      minHeight: '60vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <LoadingSpinner size={28} />
    </div>
  )

  if (session) {
    const redirectTo = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return children
}
