import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Lands here after Google OAuth or email-confirmation redirects.
 *
 * Supabase parses the hash fragment (#access_token=...) into a session
 * automatically via supabase.auth.getSession() / onAuthStateChange.
 * We just wait for the auth state to resolve, then route the user
 * to /dashboard on success or /login on failure.
 *
 * Replacing the hardcoded ${origin}/dashboard redirect with /auth/callback
 * means a transient OAuth failure can't leave the user on a protected
 * route with no session.
 */
export default function AuthCallback() {
  const { isLoading, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return
    if (session) {
      // Preserve a deep-link target if one was passed via ?next=...
      const params = new URLSearchParams(location.search)
      const next = params.get('next') || '/dashboard'
      navigate(next, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [isLoading, session, navigate, location.search])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div className="logo-mark" style={{ width: 52, height: 52, fontSize: 20, marginBottom: 20 }}>
        NH
      </div>
      <LoadingSpinner size={24} />
      <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
        Signing you in...
      </p>
    </div>
  )
}
