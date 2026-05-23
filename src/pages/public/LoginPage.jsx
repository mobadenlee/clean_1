import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth }    from '../../context/AuthContext'
import Button         from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Icon           from '../../components/ui/Icon'

// Real route at /login. Uses useNavigate to send the user to whatever
// page they were trying to reach (location.state.from, set by
// ProtectedRoute) on success — falling back to /dashboard.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, loginWithMagicLink } = useAuth()

  const [tab,       setTab]       = useState('password') // 'password' | 'magic'
  const [form,      setForm]      = useState({ email: '', password: '' })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const set = (field) => (e) => {
    setError('')
    setForm(p => ({ ...p, [field]: e.target.value }))
  }

  const handlePasswordLogin = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      // PublicOnlyRoute would redirect on its own once the session resolves,
      // but doing it explicitly preserves location.state.from from ProtectedRoute.
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  const handleMagicLink = async () => {
    if (!form.email) { setError('Enter your email address.'); return }
    setLoading(true); setError('')
    try {
      await loginWithMagicLink(form.email)
      setMagicSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send magic link.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await loginWithGoogle() }
    catch (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-left">
        <div style={{ position: 'absolute', width: 400, height: 400, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', top: '10%', left: '10%' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', bottom: '20%', right: '15%' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div className="logo-mark" style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 20px' }}>NH</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>NYSC HelpDesk</h2>
          <p style={{ opacity: 0.72, fontSize: 15, maxWidth: 300 }}>The community that has your back, from camp to clearance.</p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {['12,400+ issues resolved', '847 verified ambassadors', 'All 36 states covered'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={12} />
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-card animate-in">
          <div style={{ marginBottom: 28 }}>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Login to your NYSC HelpDesk account</p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          {/* Tab switch */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <div className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setError('') }}>Password</div>
            <div className={`tab ${tab === 'magic'    ? 'active' : ''}`} onClick={() => { setTab('magic');    setError('') }}>Magic Link</div>
          </div>

          {magicSent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                We sent a magic link to <strong>{form.email}</strong>. Click it to sign in.
              </p>
              <button className="auth-link" style={{ marginTop: 16, fontSize: 13 }} onClick={() => setMagicSent(false)}>
                Send again
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'password' ? handlePasswordLogin() : handleMagicLink())}
                />
              </div>
              {tab === 'password' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input" type="password" placeholder="Your password"
                    value={form.password} onChange={set('password')}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                  />
                </div>
              )}
              {error && (
                <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <Button onClick={tab === 'password' ? handlePasswordLogin : handleMagicLink} disabled={loading}>
                {loading
                  ? <><LoadingSpinner size={16} color="white" /> {tab === 'password' ? 'Signing in...' : 'Sending...'}</>
                  : tab === 'password' ? 'Sign In' : 'Send Magic Link'
                }
              </Button>
              {tab === 'password' && (
                <div style={{ textAlign: 'right' }}>
                  <span className="auth-link" style={{ fontSize: 13 }} onClick={() => { setTab('magic'); setError('') }}>
                    Forgot password?
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 14, marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create one free</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Link to="/" className="auth-link" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
