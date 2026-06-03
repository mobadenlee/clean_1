import { CATEGORIES, URGENCY_LEVELS, STATES } from '../../data/constants';

/**
 * Filter and sort controls for the issue feed / search page.
 *
 * All values and setters come from the `useIssueFilters` hook.
 */
export default function IssueFilters({
  category, setCategory,
  urgency,  setUrgency,
  status,   setStatus,
  state,    setState,
  sortKey,  setSortKey,
}) {
  return (
    <div>
      {/* Status + Urgency row */}
      <div className="filter-bar">
        {['All', 'Open', 'Solved'].map((s) => (
          <button
            key={s}
            className={`filter-chip ${status === s ? 'active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}

        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

        {['All', ...URGENCY_LEVELS].map((u) => (
          <button
            key={u}
            className={`filter-chip ${urgency === u ? 'active' : ''}`}
            onClick={() => setUrgency(u)}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Category row */}
      <div className="filter-bar" style={{ marginBottom: 12 }}>
        {['All', ...CATEGORIES.slice(0, 6)].map((c) => (
          <button
            key={c}
            className={`filter-chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* State dropdown — too many to render as chips, so a select matches
          SearchPage's existing UX. Default empty value means "All states". */}
      {typeof setState === 'function' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>State:</span>
          <select
            className="form-input form-select"
            value={state ?? ''}
            onChange={(e) => setState(e.target.value)}
            style={{ maxWidth: 220, fontSize: 13 }}
          >
            <option value="">All States</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Sort row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sort by:</span>
        {[
          ['recent',    'Most Recent'],
          ['upvotes',   'Most Upvoted'],
          ['responses', 'Most Responses'],
        ].map(([v, l]) => (
          <button
            key={v}
            className={`filter-chip ${sortKey === v ? 'active' : ''}`}
            style={{ fontSize: 12 }}
            onClick={() => setSortKey(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
