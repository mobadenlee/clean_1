import { useState }    from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery }    from '@tanstack/react-query'
import { useAuth }     from '../../context/AuthContext'
import { fetchAmbassadorQueue } from '../../lib/queries'
import { CategoryBadge, UrgencyBadge, Badge } from '../../components/ui/Badge'
import TrustAnalytics  from '../../components/dashboard/TrustAnalytics'
import Icon            from '../../components/ui/Icon'
import Button          from '../../components/ui/Button'
import EmptyState      from '../../components/ui/EmptyState'
import LoadingSpinner  from '../../components/ui/LoadingSpinner'

const TABS = [['queue','Priority Queue'],['analytics','Trust Analytics'],['solved','Solved Cases']]

function PriorityQueue() {
  const navigate = useNavigate()
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['ambassador-queue'],
    queryFn:  fetchAmbassadorQueue,
    staleTime: 30_000,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <LoadingSpinner size={28} />
    </div>
  )

  if (queue.length === 0) return (
    <EmptyState icon="🎉" title="All caught up!" text="No critical or high-urgency open issues right now." />
  )

  return (
    <div>
      <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
        {queue.length} issue{queue.length !== 1 ? 's' : ''} need attention · Sorted by urgency + age
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queue.map(issue => (
          <div
            key={issue.id}
            className="card card-hover"
            style={{ borderLeft: `3px solid ${issue.urgency === 'critical' ? 'var(--red)' : 'var(--amber)'}` }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{issue.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <CategoryBadge category={issue.category?.name} />
                  <UrgencyBadge  level={issue.urgency ? issue.urgency.charAt(0).toUpperCase() + issue.urgency.slice(1) : ''} />
                  <Badge text={issue.state} variant="badge-gray" icon="📍" />
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/issue/${issue.id}`)}>Respond Now</Button>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="message"   size={12} /> {issue.response_count}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="chevronUp" size={12} /> {issue.upvote_count}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="eye"       size={12} /> {issue.view_count}</span>
              <span>📅 {issue.created_at?.slice(0, 10)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AmbassadorDashboard() {
  const { currentUser } = useAuth()
  const [tab, setTab]   = useState('queue')

  const isAmbassador = ['ambassador', 'moderator', 'admin'].includes(currentUser?.role)

  if (!isAmbassador) return (
    <div className="page-content animate-in">
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
          Ambassador Panel
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, margin: '0 auto 24px' }}>
          You need a trust score of 80+ to become an Ambassador.
          Your current score: <strong>{currentUser?.trust_score ?? 0}</strong>
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  )

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Icon name="shield" size={22} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            Ambassador Panel
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your verified response hub</p>
        </div>
        <Badge text="🛡️ Ambassador" variant="badge-blue" />
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(([v, l]) => (
          <div key={v} className={`tab ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</div>
        ))}
      </div>

      {tab === 'queue'     && <PriorityQueue />}
      {tab === 'analytics' && <TrustAnalytics />}
      {tab === 'solved'    && (
        <EmptyState icon="📋" title="Solved cases" text="Resolved issues you contributed to will appear here." />
      )}
    </div>
  )
}
