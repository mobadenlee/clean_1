import { useNavigate }   from 'react-router-dom'
import { useAuth }        from '../../context/AuthContext'
import { useIssues }      from '../../hooks/useIssues'
import { useTrustEvents } from '../../hooks/useProfile'
import { useTrustScore }  from '../../hooks/useTrustScore'
import StatsGrid          from '../../components/dashboard/StatsGrid'
import IssueCard          from '../../components/issues/IssueCard'
import TrustRing          from '../../components/ui/TrustRing'
import ProgressBar        from '../../components/ui/ProgressBar'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'
import { normalizeIssue } from '../../utils/normalize'

export default function DashboardHome() {
  const { currentUser }  = useAuth()
  const navigate         = useNavigate()
  const { toAmbassador } = useTrustScore(currentUser)

  const { data: rawIssues = [], isLoading } = useIssues({ sortKey: 'recent' })
  const { data: trustEvents = [] } = useTrustEvents(currentUser?.id)

  const trust  = currentUser?.trust_score ?? 0
  const recentIssues = rawIssues.slice(0, 3).map(normalizeIssue)

  const stats = [
    { label: 'Trust Score',     value: trust, change: trust >= 80 ? '🛡️ Ambassador' : `${toAmbassador} to Ambassador`, up: true, icon: '⭐' },
    { label: 'Helpful Answers', value: trustEvents.filter(e => e.event_type === 'response_upvoted').length, change: 'upvoted responses', up: true, icon: '💬' },
    { label: 'Issues Solved',   value: trustEvents.filter(e => e.event_type === 'issue_marked_solved').length, change: 'via your responses', up: true, icon: '✅' },
    { label: 'Trust Events',    value: trustEvents.length, change: 'total activity', up: true, icon: '📊' },
  ]

  return (
    <div className="page-content animate-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Good morning, {currentUser?.full_name?.split(' ')[0] ?? 'Corper'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Here's what's happening with your issues today.
        </p>
      </div>

      {trust >= 60 && trust < 80 && (
        <div style={{ background: 'var(--gradient)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: 'white' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              🏆 You're close to Ambassador status!
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {toAmbassador} more trust point{toAmbassador !== 1 ? 's' : ''} to unlock Ambassador verification.
            </div>
          </div>
          <button className="btn-hero-primary" style={{ background: 'white', color: 'var(--accent)', fontSize: 13 }} onClick={() => navigate('/feed')}>
            Help the Community →
          </button>
        </div>
      )}

      {trust >= 80 && (
        <div style={{ background: 'var(--gradient)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 36 }}>🛡️</div>
          <div style={{ color: 'white' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>You're an Ambassador!</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Your responses are prioritised in the community feed.</div>
          </div>
        </div>
      )}

      <StatsGrid stats={stats} />

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Trust Score Progress</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Ambassador threshold: 80</p>
          </div>
          <TrustRing score={trust} />
        </div>
        <ProgressBar value={trust} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Current: {trust}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ambassador: 80</span>
        </div>

        {trustEvents.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>RECENT ACTIVITY</p>
            {trustEvents.slice(0, 4).map(ev => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', color: 'var(--text-secondary)' }}>
                <span>{ev.reason || ev.event_type.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 700, color: ev.delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {ev.delta >= 0 ? '+' : ''}{ev.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Recent Community Issues</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/feed')}>View All →</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <LoadingSpinner size={28} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentIssues.map(issue => (
            <IssueCard key={issue.id} issue={issue} compact />
          ))}
        </div>
      )}
    </div>
  )
}
