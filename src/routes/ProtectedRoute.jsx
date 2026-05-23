import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Wraps authenticated-only routes.
 * - While auth is still resolving (session === undefined), shows a spinner.
 * - When there's no session, redirects to /login and preserves the
 *   intended destination in location.state.from so we can bounce back
 *   after a successful sign-in.
 */
export default function ProtectedRoute({ children }) {
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

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
