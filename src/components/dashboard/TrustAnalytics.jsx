import ProgressBar from '../ui/ProgressBar';

const WEEKLY = [
  ['Mon', 60], ['Tue', 80], ['Wed', 45],
  ['Thu', 90], ['Fri', 70], ['Sat', 85], ['Sun', 55],
];

const PERFORMANCE = [
  ['Response Accuracy',      97, 'var(--green)'],
  ['Helpfulness Rating',     94, 'var(--accent)'],
  ['Community Satisfaction', 91, 'var(--teal)'],
  ['Response Speed',         88, 'var(--amber)'],
];

const HISTORY = [
  ['Jan','82'],['Feb','85'],['Mar','87'],
  ['Apr','89'],['May','91'],['Jun','94'],
];

/**
 * Ambassador analytics panel — bar chart, performance breakdown,
 * and trust-score history. Used in the Ambassador dashboard.
 */
export default function TrustAnalytics() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Performance breakdown */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Response Performance</h3>
        {PERFORMANCE.map(([label, value, color]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 13, marginBottom: 5,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 700, color }}>{value}%</span>
            </div>
            <ProgressBar value={value} color={color} />
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Weekly Activity</h3>
        <div className="bar-chart">
          {WEEKLY.map(([day, val]) => (
            <div
              key={day}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div className="bar" style={{ height: `${val}%`, width: '100%' }} data-val={val} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust score history */}
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Trust Score History</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {HISTORY.map(([month, score]) => (
            <div key={month} style={{ textAlign: 'center', flex: 1, minWidth: 60 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 18, color: 'var(--accent)',
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{month}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
