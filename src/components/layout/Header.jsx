import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth }          from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { PAGE_TITLES }      from '../../data/constants'
import Avatar               from '../ui/Avatar'
import Icon                 from '../ui/Icon'
import Button               from '../ui/Button'

function getInitials(name) {
  if (!name || !name.trim()) return 'NH'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Header() {
  const { currentUser } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate        = useNavigate()
  const { pathname }    = useLocation()

  const pageKey = pathname.split('/')[1] || 'dashboard'
  const title   = PAGE_TITLES[pageKey] ?? 'NYSC HelpDesk'

  const displayName = currentUser?.full_name
    || currentUser?.username
    || currentUser?.email?.split('@')[0]
    || 'User'

  const firstName = displayName.split(' ')[0]

  const avatarUser = {
    initials: getInitials(displayName),
    color:    '#2F5BE8',
  }

  return (
    <header className="page-header">
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {pathname !== '/search' && (
          <div className="search-bar">
            <Icon name="search" size={14} />
            <input placeholder="Search issues..." onClick={() => navigate('/search')} readOnly />
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/notifications')}
        >
          <Icon name="bell" size={14} />
          {unreadCount > 0 && (
            <span className="nav-badge" style={{ position: 'static', margin: 0 }}>
              {unreadCount}
            </span>
          )}
        </button>

        <Button size="sm" onClick={() => navigate('/post-issue')}>
          <Icon name="plus" size={14} /> Post Issue
        </Button>

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
          onClick={() => navigate('/profile')}
        >
          <Avatar user={avatarUser} size={26} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{firstName}</span>
        </div>
      </div>
    </header>
  )
}
