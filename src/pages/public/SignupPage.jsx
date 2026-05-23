import { useState } from 'react'
import { useNavigate, Link }   from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { STATES, BATCHES }     from '../../data/constants'
import Button                  from '../../components/ui/Button'
import LoadingSpinner          from '../../components/ui/LoadingSpinner'
import { validateSignupForm }  from '../../utils/validators'

// Real route at /signup. After a successful signup with no session
// (email-confirmation flow), we render the "check your email" panel.
// If a session was created immediately, PublicOnlyRoute kicks in and
// bounces to /dashboard once the auth state updates.
export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, loginWithGoogle } = useAuth()

  const [form,     setForm]     = useState({ name: '', email: '', password: '', state: '', batch: '' })
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState(false)

  const set = (field) => (e) => {
    setApiError('')
    setErrors(p => ({ ...p, [field]: '' }))
    setForm(p => ({ ...p, [field]: e.target.value }))
  }

  const submit = async () => {
    const errs = validateSignupForm(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError('')
    try {
      const { data } = await signup({
        email:    form.email,
        password: form.password,
        fullName: form.name,
        state:    form.state,
        batch:    form.batch,
      })
      // If email confirmation is required, session won't exist yet
      if (data?.user && !data.session) setSuccess(true)
      // If a session was created immediately, navigate to /dashboard.
      // PublicOnlyRoute would handle this on the next render, but being
      // explicit avoids one frame of stale UI.
      else if (data?.session) navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try { await loginWithGoogle() }
    catch (err) { setApiError(err.message); setLoading(false) }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
          Check your email
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
          We sent a confirmation link to <strong>{form.email}</strong>.
          Click it to activate your account.
        </p>
        <button className="auth-link" style={{ marginTop: 24, fontSize: 14, display: 'block', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/login')}>
          Back to login
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            Join NYSC HelpDesk
          </h2>
          <p style={{ opacity: 0.72, fontSize: 14, maxWidth: 280 }}>
            Connect with the community that's solved every NYSC problem imaginable.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card animate-in">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Free forever. No credit card required.</p>

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
            Sign up with Google
          </button>

          <div className="auth-divider">or sign up with email</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Chidi Okonkwo" value={form.name} onChange={set('name')} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Deployment State</label>
                <select className="form-input form-select" value={form.state} onChange={set('state')}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="form-error">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Batch</label>
                <select className="form-input form-select" value={form.batch} onChange={set('batch')}>
                  <option value="">Select batch</option>
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {apiError && (
              <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                {apiError}
              </div>
            )}

            <Button onClick={submit} disabled={loading}>
              {loading
                ? <><LoadingSpinner size={16} color="white" /> Creating account...</>
                : 'Create Free Account'
              }
            </Button>
          </div>

          <div className="auth-divider" />
          <div style={{ textAlign: 'center', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
