import ProgressBar       from '../ui/ProgressBar';
import { getTrustBreakdown } from '../../utils/trustCalculator';

/**
 * Visual trust-score breakdown with individual metric bars.
 * Shown on the profile page.
 *
 * @param {{ user: Object }} props
 */
export default function TrustBreakdown({ user }) {
  const breakdown = getTrustBreakdown(user);

  return (
    <div className="card">
      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Trust Score Breakdown</h3>

      {breakdown.map(({ label, value }) => (
        <div key={label} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 13, marginBottom: 4,
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}%</span>
          </div>
          <ProgressBar value={value} height={5} />
        </div>
      ))}
    </div>
  );
}
