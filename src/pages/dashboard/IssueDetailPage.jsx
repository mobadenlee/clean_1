import { useState }               from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssue, useEditIssue, useDeleteIssue } from '../../hooks/useIssues'
import { useResponses }           from '../../hooks/useResponses'
import { useVote, useUserVotes }  from '../../hooks/useVotes'
import { useToggleSaved, useIsSaved } from '../../hooks/useSavedIssues'
import { useAuth }                from '../../context/AuthContext'
import { Badge, CategoryBadge, UrgencyBadge } from '../../components/ui/Badge'
import Avatar                     from '../../components/ui/Avatar'
import Icon                       from '../../components/ui/Icon'
import Button                     from '../../components/ui/Button'
import LoadingSpinner             from '../../components/ui/LoadingSpinner'
import IssueThread                from '../../components/issues/IssueThread'
import PostActionsMenu            from '../../components/issues/PostActionsMenu'
import EditIssueModal             from '../../components/issues/EditIssueModal'
import ConfirmModal               from '../../components/ui/ConfirmModal'
import { normalizeIssue }         from '../../utils/normalize'

export default function IssueDetailPage() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const { currentUser } = useAuth()

  const { data: rawIssue, isLoading: issueLoading } = useIssue(id)
  const { data: responses = [], isLoading: respLoading } = useResponses(id)

  const issue   = rawIssue ? normalizeIssue(rawIssue) : null
  const isSaved = useIsSaved(id)
  const toggleSaved = useToggleSaved()

  // Seed initial voted/voteId from the server so a remount doesn't reset
  // the UI to "not voted" and let the user double-vote.
  const { lookup: lookupVote } = useUserVotes({ issueIds: id ? [id] : [] })
  const existingVote = lookupVote('issue', id)

  const { voted, voteCount, toggle: toggleVote } = useVote({
    targetId:      id,
    type:          'issue',
    initialCount:  rawIssue?.upvote_count ?? 0,
    initialVoted:  !!existingVote,
    initialVoteId: existingVote?.id ?? null,
  })

  if (issueLoading) return (
    <div className="page-content animate-in" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <LoadingSpinner size={36} />
    </div>
  )

  if (!issue) return (
    <div className="page-content animate-in" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>Issue not found</h2>
      <Button onClick={() => navigate('/feed')}>← Back to Feed</Button>
    </div>
  )

  const canMarkSolved = currentUser?.id === rawIssue?.author_id
  const isOwner       = currentUser?.id === rawIssue?.author_id
  const wasEdited     = rawIssue?.updated_at && rawIssue?.created_at &&
                        new Date(rawIssue.updated_at) - new Date(rawIssue.created_at) > 1000

  const [editOpen, setEditOpen]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const editIssue   = useEditIssue()
  const deleteIssue = useDeleteIssue()

  const handleSave = () => {
    toggleSaved.mutate({ issueId: id, isSaved })
  }

  const handleEditSave = (updates) => {
    editIssue.mutate({ issueId: id, updates }, { onSuccess: () => setEditOpen(false) })
  }

  const handleDelete = () => {
    deleteIssue.mutate(id) // navigates to /feed on success
  }

  return (
    <div className="page-content animate-in" style={{ maxWidth: 820 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/feed')} style={{ padding: '4px 8px' }}>
          ← Back to Feed
        </button>
        <span>/</span>
        <span>{issue.category}</span>
        <span>/</span>
        <span className="truncate" style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>{issue.title}</span>
      </div>

      {/* Issue card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <button className={`upvote-btn ${voted ? 'voted' : ''}`} onClick={toggleVote}>
            <Icon name="chevronUp" size={16} />
            <span>{voteCount}</span>
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <CategoryBadge category={issue.category} />
              <UrgencyBadge  level={issue.urgency} />
              <Badge text={issue.state} variant="badge-gray" icon="📍" />
              {issue.lga && <Badge text={issue.lga} variant="badge-gray" icon="🏘️" />}
              {issue.solved && <Badge text="Solved" variant="badge-green" icon="✓" />}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, lineHeight: 1.35, marginBottom: 14 }}>
              {issue.title}
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              {rawIssue.body}
            </p>

            {issue.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {issue.tags.map(t => (
                  <span key={t} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20 }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar user={issue.author} size={28} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{issue.author.name}</span>
                  {issue.author.ambassador && <Badge text="Ambassador" variant="badge-blue" />}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                    · {issue.createdAt}{wasEdited && ' · (edited)'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentUser && (
                  <Button variant="secondary" size="sm" onClick={handleSave} disabled={toggleSaved.isPending}>
                    <Icon name="bookmark" size={13} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                )}
                {isOwner && (
                  <PostActionsMenu
                    onEdit={() => setEditOpen(true)}
                    onDelete={() => setDeleteOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta stats */}
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="eye"       size={13} /> {rawIssue.view_count} views</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="message"   size={13} /> {responses.length} responses</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="chevronUp" size={13} /> {voteCount} upvotes</span>
      </div>

      <IssueThread
        issueId={id}
        responses={responses}
        respLoading={respLoading}
        canMarkSolved={canMarkSolved}
        issueStatus={rawIssue.status}
      />

      {isOwner && (
        <>
          <EditIssueModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            issue={rawIssue}
            onSave={handleEditSave}
            saving={editIssue.isPending}
          />
          <ConfirmModal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete this issue?"
            message="This permanently deletes the issue and all its responses. This cannot be undone."
            confirmText="Delete Issue"
            onConfirm={handleDelete}
            busy={deleteIssue.isPending}
          />
        </>
      )}
    </div>
  )
}
