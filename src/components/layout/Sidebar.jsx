import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth }          from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { NAV_ITEMS }        from '../../data/constants'
import Avatar               from '../ui/Avatar'
import Icon                 from '../ui/Icon'
import { getInitials }      from '../../utils/formatters'

const SECTIONS       = ['main', 'account', 'ambassador']
const SECTION_LABELS = { main: 'Platform', account: 'My Account', ambassador: 'Ambassador' }

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate        = useNavigate()
  const { pathname }    = useLocation()

  const go = (path) => { navigate(path); onClose() }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      // Always land on /login, even if signOut errored, so the user isn't stuck.
      onClose()
      navigate('/login', { replace: true })
    }
  }

  // Robust display name — never shows "Loading..."
  const displayName = currentUser?.full_name
    || currentUser?.username
    || currentUser?.email?.split('@')[0]
    || 'NYSC Member'

  const avatarUser = {
    initials: getInitials(displayName),
    color:    '#2F5BE8',
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">NH</div>
          <div>
            <div className="logo-text">NYSC HelpDesk</div>
            <div className="logo-sub">Community Support Platform</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map(section => (
            <div key={section}>
              <div className="nav-section-label">{SECTION_LABELS[section]}</div>
              {NAV_ITEMS.filter(i => i.section === section).map(item => {
                const to       = `/${item.id}`
                const isActive = pathname === to || pathname.startsWith(to + '/')
                const badge    = item.id === 'notifications' ? unreadCount : (item.badge ?? 0)
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => go(to)}
                    data-onboard={
                      item.id === 'feed'   ? 'feed' :
                      item.id === 'search' ? 'search' :
                      undefined
                    }
                  >
                    <span className="nav-icon"><Icon name={item.icon} size={16} /></span>
                    {item.label}
                    {badge > 0 && <span className="nav-badge">{badge}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => go('/profile')}>
            <Avatar user={avatarUser} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Trust: {currentUser?.trust_score ?? 0}
                {currentUser?.role && currentUser.role !== 'member' && ` · ${currentUser.role}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              marginTop: 8,
              padding: '8px 12px',
              background: 'none',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Icon name="logout" size={16} />
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}
