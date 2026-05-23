import { useNotifications, useMarkNotifRead, useMarkAllNotifsRead } from '../../hooks/useNotifications'
import Button         from '../../components/ui/Button'
import EmptyState     from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const NOTIF_ICONS = {
  new_response:          '💬',
  issue_solved:          '✅',
  upvote_received:       '⬆️',
  ambassador_nominated:  '🏆',
  trust_milestone:       '⭐',
  moderation_action:     '⚠️',
  system:                '🔔',
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, unreadCount } = useNotifications()
  const markRead    = useMarkNotifRead()
  const markAllRead = useMarkAllNotifsRead()

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Notifications</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><LoadingSpinner size={28} /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" text="You'll see updates about your issues and responses here." />
      ) : (
        <div className="card">
          {notifications.map((n, idx) => (
            <div
              key={n.id}
              className="notification-item"
              style={{
                background:   n.is_read ? 'transparent' : 'var(--accent-light)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: idx < notifications.length - 1 ? 2 : 0,
                cursor:       'pointer',
              }}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
            >
              <div style={{ fontSize: 20, width: 36, textAlign: 'center', flexShrink: 0 }}>
                {NOTIF_ICONS[n.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: n.is_read ? 400 : 600 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.is_read && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
