import { useNavigate }   from 'react-router-dom'
import { useSavedIssues } from '../../hooks/useSavedIssues'
import IssueCard          from '../../components/issues/IssueCard'
import EmptyState         from '../../components/ui/EmptyState'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'
import Button             from '../../components/ui/Button'
import { normalizeIssue } from '../../utils/normalize'

export default function SavedIssuesPage() {
  const navigate                          = useNavigate()
  const { data: raw = [], isLoading }     = useSavedIssues()
  const savedIssues                       = raw.map(normalizeIssue)

  return (
    <div className="page-content animate-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Saved Issues</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
          {isLoading ? 'Loading...' : `${savedIssues.length} issue${savedIssues.length !== 1 ? 's' : ''} bookmarked`}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><LoadingSpinner size={28} /></div>
      ) : savedIssues.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No saved issues"
          text="Bookmark issues from the feed to track them here."
          action={<Button variant="secondary" onClick={() => navigate('/feed')}>Browse the Feed</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {savedIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
        </div>
      )}
    </div>
  )
}
