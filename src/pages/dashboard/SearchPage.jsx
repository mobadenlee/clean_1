import { useIssues }       from '../../hooks/useIssues'
import { useIssueFilters } from '../../hooks/useIssueFilters'
import { CATEGORIES, STATES } from '../../data/constants'
import IssueCard           from '../../components/issues/IssueCard'
import EmptyState          from '../../components/ui/EmptyState'
import LoadingSpinner      from '../../components/ui/LoadingSpinner'
import Icon                from '../../components/ui/Icon'
import { normalizeIssue }  from '../../utils/normalize'

const POPULAR = [
  'allawee not paid', 'PPA rejection', 'clearance portal',
  'biometrics failed', 'CDS group', 'posting problem',
  'SAED certificate', 'accommodation',
]

export default function SearchPage() {
  const filters  = useIssueFilters()
  // Audit fix: filters.category defaults to 'All' (truthy), so the old
  // `filters.category` check was ALWAYS true and the !hasQuery branch
  // (popular searches + recently-solved) never rendered.
  //
  // hasQuery is true when the user has typed >1 char, picked a state,
  // chosen a category other than "All", or chosen a status other than "All".
  const hasQuery =
    filters.query.length > 1 ||
    filters.state !== '' ||
    (filters.category !== '' && filters.category !== 'All') ||
    filters.status !== 'All'

  const { data: rawIssues = [], isLoading } = useIssues(
    hasQuery
      ? { search: filters.query, state: filters.state, category: filters.category, status: filters.status }
      : { status: 'Solved', sortKey: 'upvotes' }
  )

  const results = rawIssues.map(normalizeIssue)

  return (
    <div className="page-content animate-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Search Issues</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Your problem has probably been solved before. Find it here.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="search-bar" style={{ width: '100%', marginBottom: 16, padding: '12px 16px' }}>
          <Icon name="search" size={18} />
          <input
            placeholder="Search by keyword — e.g. 'allawee not paid', 'biometrics', 'PPA rejected'..."
            value={filters.query}
            onChange={e => filters.setQuery(e.target.value)}
            style={{ fontSize: 15 }}
          />
          {filters.query && <button onClick={() => filters.setQuery('')}><Icon name="x" size={14} /></button>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Filter by State</label>
            <select className="form-input form-select" value={filters.state} onChange={e => filters.setState(e.target.value)}>
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter by Category</label>
            <select className="form-input form-select" value={filters.category} onChange={e => filters.setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={filters.status} onChange={e => filters.setStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Solved">Solved</option>
              <option value="Open">Open</option>
            </select>
          </div>
        </div>
      </div>

      {!hasQuery ? (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-secondary)' }}>Popular searches</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {POPULAR.map(t => (
              <button key={t} className="filter-chip" onClick={() => filters.setQuery(t)}>🔍 {t}</button>
            ))}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-secondary)' }}>Recently solved issues</h3>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><LoadingSpinner size={24} /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(i => <IssueCard key={i.id} issue={i} compact />)}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><LoadingSpinner size={28} /></div>
      ) : results.length === 0 ? (
        <EmptyState icon="🤷" title="No results found" text="Try different keywords or remove filters. If your issue isn't here, post it!" />
      ) : (
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map(i => <IssueCard key={i.id} issue={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
