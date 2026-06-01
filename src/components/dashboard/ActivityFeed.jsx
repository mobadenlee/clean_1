/**
 * Recent-activity list shown on the profile page and dashboard.
 * Renders only real activities passed in; shows an empty state when there
 * are none. (No more hardcoded sample data — the fake fallback that used
 * to live here was removed.)
 *
 * @param {{ activities?: Array }} props
 */
export default function ActivityFeed({ activities = [] }) {
  if (!activities.length) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
        No activity yet.
      </p>
    )
  }

  return (
    <div>
      {activities.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '8px 0',
            borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{ fontSize: 16 }}>{a.icon}</span>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.text}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
