import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '💬', color: 'var(--accent-light)',  title: 'Post Issues Clearly',     desc: 'Structured issue forms with categories, states, urgency levels, and anonymous posting options.' },
  { icon: '🛡️', color: 'var(--purple-light)', title: 'Verified Ambassadors',    desc: 'Trust-ranked corpers and alumni who provide authoritative, verified answers to complex issues.' },
  { icon: '🔍', color: 'var(--teal-light)',    title: 'Search Solved Issues',    desc: 'Find similar problems instantly. Chances are your issue has already been solved by someone before you.' },
  { icon: '⬆️', color: 'var(--amber-light)',  title: 'Community Upvoting',      desc: 'The best answers rise to the top through community voting. Quality over noise.' },
  { icon: '📊', color: 'var(--green-light)',   title: 'Trust & Reputation',      desc: "Every helper earns a trust score. See who's actually reliable before following their advice." },
  { icon: '🔔', color: 'var(--red-light)',     title: 'Real-Time Updates',       desc: "Get notified when someone responds to your issue, upvotes your answer, or marks your issue solved." },
]

const HERO_STATS = [
  ['12,400+', 'Issues Resolved'],
  ['847',     'Verified Ambassadors'],
  ['98%',     'Response Rate'],
  ['36',      'States Covered'],
]

// Now a real route at "/". Uses useNavigate for /login and /signup
// instead of view-state callbacks passed from App.jsx.
export default function LandingPage() {
  const navigate = useNavigate()
  const onLogin  = () => navigate('/login')
  const onSignup = () => navigate('/signup')

  return (
    <div>
      <div className="landing-hero">
        <div className="hero-bg-circle" style={{ width: 600, height: 600, top: -200, right: -200, animationDelay: '0s' }} />
        <div className="hero-bg-circle" style={{ width: 300, height: 300, bottom: -100, left: -50,  animationDelay: '2s' }} />
        <div className="hero-bg-circle" style={{ width: 200, height: 200, top: '30%', left: '15%', animationDelay: '4s' }} />

        <nav className="landing-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-mark">NH</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'white' }}>
              NYSC HelpDesk
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-hero-ghost" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={onLogin}>
              Login
            </button>
            <button className="btn-hero-primary" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={onSignup}>
              Get Started →
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-inner animate-in">
            <div className="hero-eyebrow">
              <div className="hero-dot" />
              Community-Powered NYSC Support
            </div>
            <h1 className="hero-title">Every Corper Deserves <span>Real Answers</span></h1>
            <p className="hero-subtitle">
              Stop guessing. Stop asking random WhatsApp groups. NYSC HelpDesk connects you with
              verified ambassadors and thousands of corps members who have solved the exact same
              problem you're facing.
            </p>
            <div className="hero-cta">
              <button className="btn-hero-primary btn-lg" onClick={onSignup}>
                Post Your Issue Free
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button className="btn-hero-ghost btn-lg" onClick={onLogin}>
                Browse Solved Issues
              </button>
            </div>
            <div className="hero-stats">
              {HERO_STATS.map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="hero-stat-val">{val}</div>
                  <div className="hero-stat-lab">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Everything You Need to Navigate NYSC</h2>
        <p className="section-sub">From camp drama to clearance confusion — we've seen it all.</p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--text-primary)', padding: '60px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 12 }}>
          Ready to get your issue resolved?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 28, fontSize: 15 }}>
          Join 40,000+ corps members using NYSC HelpDesk.
        </p>
        <button className="btn-hero-primary btn-lg" onClick={onSignup}>Create Free Account</button>
      </div>
    </div>
  )
}
