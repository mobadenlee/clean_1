import { useLocation, useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { PAGE_TITLES }      from '../../data/constants'
import Icon                 from '../ui/Icon'

export default function MobileHeader({ onOpenSidebar }) {
  const { unreadCount } = useNotifications()
  const navigate        = useNavigate()
  const { pathname }    = useLocation()

  const pageKey = pathname.split('/')[1] || 'dashboard'
  const title   = PAGE_TITLES[pageKey] ?? 'NYSC HelpDesk'

  return (
    <div className="mobile-header">
      <button onClick={onOpenSidebar} className="btn btn-ghost btn-icon">
        <Icon name="menu" size={20} />
      </button>

      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
        {title}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative' }}
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--red)', border: '2px solid white',
            }} />
          )}
        </button>
      </div>
    </div>
  )
}
