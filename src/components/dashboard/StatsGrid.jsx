/**
 * Renders a responsive grid of stat cards.
 *
 * @param {{ stats: Array<{ label, value, change, up, icon }> }} props
 */
export default function StatsGrid({ stats = [] }) {
  return (
    <div className="grid-4" style={{ marginBottom: 28 }}>
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
            {s.up ? '↑' : '↓'} {s.change}
          </div>
        </div>
      ))}
    </div>
  );
}
