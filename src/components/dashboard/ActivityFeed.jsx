const ACTIVITIES = [
  { text: 'Answered PPA rejection issue',            time: '2h ago',  icon: '💬' },
  { text: "Issue 'Allawee delay' marked solved",     time: '1d ago',  icon: '✅' },
  { text: 'Received 15 upvotes on response',         time: '2d ago',  icon: '⬆️' },
  { text: 'Trust score increased to 65',             time: '3d ago',  icon: '⭐' },
];

/**
 * Recent-activity list shown on the profile page and dashboard.
 *
 * @param {{ activities?: Array }} props
 */
export default function ActivityFeed({ activities = ACTIVITIES }) {
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
  );
}
