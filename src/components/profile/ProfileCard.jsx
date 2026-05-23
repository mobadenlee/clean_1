import Avatar   from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import Icon      from '../ui/Icon';

/**
 * Profile banner + info card — shown at the top of the profile page.
 *
 * @param {{ user: Object }} props
 */
export default function ProfileCard({ user }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
      {/* Banner */}
      <div className="profile-banner" />

      {/* Info section */}
      <div style={{ padding: '40px 24px 24px', position: 'relative' }}>
        {/* Avatar — positioned over the banner */}
        <div className="profile-avatar-wrap" style={{ position: 'absolute', top: -40, left: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar user={user} size={72} />
            {user.ambassador && (
              <div className="ambassador-badge-wrap">
                <Icon name="shield" size={10} />
              </div>
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div style={{ marginLeft: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20, fontWeight: 800,
              }}
            >
              {user.name}
            </h1>
            {user.ambassador && <Badge text="🛡️ Ambassador" variant="badge-blue" />}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Batch {user.batch} · Deployed in {user.state}
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              ['Trust Score',    user.trust,       '⭐'],
              ['Issues Solved',  user.solvedCount, '✅'],
              ['Helpful Answers', 12,              '💬'],
            ].map(([label, value, icon]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20, fontWeight: 800,
                  }}
                >
                  {icon} {value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
