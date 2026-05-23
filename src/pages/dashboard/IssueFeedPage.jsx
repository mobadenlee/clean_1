import { useNavigate }     from 'react-router-dom'
import { useIssues }       from '../../hooks/useIssues'
import { useIssueFilters } from '../../hooks/useIssueFilters'
import { useTopAmbassadors } from '../../hooks/useProfile'
import IssueCard           from '../../components/issues/IssueCard'
import IssueFilters        from '../../components/issues/IssueFilters'
import EmptyState          from '../../components/ui/EmptyState'
import TrustRing           from '../../components/ui/TrustRing'
import Avatar              from '../../components/ui/Avatar'
import Button              from '../../components/ui/Button'
import LoadingSpinner      from '../../components/ui/LoadingSpinner'
import Icon                from '../../components/ui/Icon'
import { normalizeIssue, normalizeUser } from '../../utils/normalize'

const TRENDING = [
  ['Payment/Allowance', 34], ['Clearance', 28],
  ['PPA Issues', 22],        ['Biometrics', 18],
]

export default function IssueFeedPage() {
  const navigate  = useNavigate()
  const filters   = useIssueFilters()

  const { data: rawIssues = [], isLoading, isError } = useIssues({
    category: filters.category,
    state:    filters.state,
    urgency:  filters.urgency,
    status:   filters.status,
    search:   filters.query,
    sortKey:  filters.sortKey,
  })

  const { data: ambassadors = [] } = useTopAmbassadors()
  const issues = rawIssues.map(normalizeIssue)

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Issue Feed</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
            {isLoading ? 'Loading...' : `${issues.length} issues`}
          </p>
        </div>
        <Button onClick={() => navigate('/post-issue')}>
          <Icon name="plus" size={15} /> Post Issue
        </Button>
      </div>

      <div className="feed-layout">
        <div>
          <div className="search-bar" style={{ width: '100%', marginBottom: 14 }}>
            <Icon name="search" size={15} />
            <input
              placeholder="Search issues by title or description..."
              value={filters.query}
              onChange={e => filters.setQuery(e.target.value)}
            />
            {filters.query && <button onClick={() => filters.setQuery('')}><Icon name="x" size={14} /></button>}
          </div>

          <IssueFilters
            category={filters.category} setCategory={filters.setCategory}
            urgency={filters.urgency}   setUrgency={filters.setUrgency}
            status={filters.status}     setStatus={filters.setStatus}
            sortKey={filters.sortKey}   setSortKey={filters.setSortKey}
          />

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <LoadingSpinner size={32} />
            </div>
          ) : isError ? (
            <EmptyState icon="⚠️" title="Failed to load issues" text="Check your connection and refresh." />
          ) : issues.length === 0 ? (
            <EmptyState icon="🔍" title="No issues found" text="Try adjusting your filters or search terms." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top Ambassadors</h3>
            {ambassadors.map(u => {
              const norm = normalizeUser(u)
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar user={norm} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{u.state}</div>
                  </div>
                  <TrustRing score={u.trust_score} />
                </div>
              )
            })}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Trending Categories</h3>
            {TRENDING.map(([cat, pct]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct * 2}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid rgba(47,91,232,0.15)' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🛡️</div>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--accent)' }}>Become an Ambassador</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              Help other corps members and earn your Ambassador badge.
            </p>
            <Button size="sm" style={{ width: '100%' }} onClick={() => navigate('/ambassador')}>Learn More</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
