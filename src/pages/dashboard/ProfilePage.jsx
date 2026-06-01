import { useState }       from 'react'
import { useAuth }        from '../../context/AuthContext'
import { useTrustEvents } from '../../hooks/useProfile'
import ProfileCard        from '../../components/profile/ProfileCard'
import TrustBreakdown     from '../../components/profile/TrustBreakdown'
import ActivityFeed       from '../../components/dashboard/ActivityFeed'
import EditProfileModal   from '../../components/profile/EditProfileModal'
import Button             from '../../components/ui/Button'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'

function getInitials(name) {
  if (!name || !name.trim()) return 'NH'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProfilePage() {
  const { currentUser, isLoading: authLoading } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const {
    data: trustEvents = [],
    isLoading: eventsLoading,
    isError:   eventsError,
  } = useTrustEvents(currentUser?.id)

  // Still resolving the auth session
  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <LoadingSpinner size={32} />
    </div>
  )

  // Auth resolved but no user (shouldn't happen in authenticated route, but guard anyway)
  if (!currentUser) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Profile unavailable. Try refreshing.</p>
    </div>
  )

  const displayName = currentUser.full_name || currentUser.username || currentUser.email || 'NYSC Member'

  const userForCard = {
    name:        displayName,
    initials:    getInitials(displayName),
    color:       '#2F5BE8',
    trust:       currentUser.trust_score ?? 0,
    ambassador:  ['ambassador', 'moderator', 'admin'].includes(currentUser.role),
    bestAnswerCount: trustEvents.filter(e => e.event_type === 'best_answer_marked').length,
    helpfulCount:    trustEvents.filter(e => e.event_type === 'response_upvoted').length,
    state:       currentUser.state,
    batch:       currentUser.batch,
  }

  const userForTrust = { trust: currentUser.trust_score ?? 0, trustEvents }

  const activities = trustEvents.slice(0, 6).map(ev => ({
    text: ev.reason || ev.event_type.replace(/_/g, ' '),
    time: new Date(ev.created_at).toLocaleString('en-NG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    icon: ev.delta >= 0 ? '⭐' : '⚠️',
  }))

  return (
    <div className="page-content animate-in" style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          Edit Profile
        </Button>
      </div>

      <ProfileCard user={userForCard} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <TrustBreakdown user={userForTrust} />
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Recent Activity</h3>
          {eventsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <LoadingSpinner size={20} />
            </div>
          ) : eventsError ? (
            // Most likely cause: trust_events table missing or RLS blocking
            // read for this user. We render a quiet placeholder instead of
            // leaving the spinner stalled or the card empty with no signal.
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Couldn't load recent activity right now.
            </p>
          ) : (
            <ActivityFeed activities={activities} />
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        currentUser={currentUser}
      />
    </div>
  )
}
