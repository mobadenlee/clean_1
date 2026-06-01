import { useState }        from 'react'
import { useCreateResponse } from '../../hooks/useResponses'
import { useMarkSolved }     from '../../hooks/useIssues'
import { useVote, useUserVotes } from '../../hooks/useVotes'
import { useAuth }           from '../../context/AuthContext'
import { Badge }             from '../ui/Badge'
import Avatar                from '../ui/Avatar'
import TrustRing             from '../ui/TrustRing'
import Icon                  from '../ui/Icon'
import Button                from '../ui/Button'
import EmptyState            from '../ui/EmptyState'
import LoadingSpinner        from '../ui/LoadingSpinner'
import { getInitials }       from '../../utils/formatters'

function roleColor(role) {
  const map = { ambassador: '#2F5BE8', moderator: '#7C3AED', admin: '#DC2626', member: '#0D9488' }
  return map[role] ?? '#9BA8BE'
}

function ResponseItem({ response, issueId, canMarkSolved, issueStatus, initialVote }) {
  const markSolved = useMarkSolved()
  const author     = response.author ?? {}
  const isAnon     = response.is_anonymous || !author.id
  const displayName = isAnon ? 'Anonymous' : (author.full_name ?? 'Unknown')

  const { voted, voteCount, toggle } = useVote({
    targetId:      response.id,
    type:          'response',
    initialCount:  response.upvote_count ?? 0,
    initialVoted:  !!initialVote,
    initialVoteId: initialVote?.id ?? null,
  })

  const cardClass = response.is_best_answer
    ? 'response-card best'
    : response.is_ambassador_response
    ? 'response-card ambassador'
    : 'response-card'

  return (
    <div className={cardClass}>
      {response.is_best_answer && (
        <div style={{ marginBottom: 8 }}>
          <Badge text="✓ Best Answer" variant="badge-green" />
        </div>
      )}
      {response.is_ambassador_response && !response.is_best_answer && (
        <div style={{ marginBottom: 8 }}>
          <Badge text="🛡️ Ambassador Response" variant="badge-blue" />
        </div>
      )}

      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 14 }}>
        {response.body}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar user={{ initials: getInitials(displayName), color: isAnon ? '#9BA8BE' : roleColor(author.role) }} size={26} />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{displayName}</span>
          {!isAnon && author.trust_score > 0 && <TrustRing score={author.trust_score} />}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            · {response.created_at?.slice(0, 10)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canMarkSolved && issueStatus === 'open' && !response.is_best_answer && (
            <Button
              variant="secondary" size="sm"
              onClick={() => markSolved.mutate({ issueId, responseId: response.id })}
              disabled={markSolved.isPending}
            >
              {markSolved.isPending ? <LoadingSpinner size={12} /> : '✓ Mark as Solution'}
            </Button>
          )}
          <button
            className={`upvote-btn ${voted ? 'voted' : ''}`}
            style={{ flexDirection: 'row', padding: '5px 10px' }}
            onClick={toggle}
          >
            <Icon name="chevronUp" size={13} />
            <span>{voteCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IssueThread({ issueId, responses = [], respLoading, canMarkSolved, issueStatus }) {
  const { currentUser } = useAuth()
  const createResponse  = useCreateResponse(issueId)
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(false)

  // Single batched fetch of the current user's votes on this thread's
  // responses. We pass per-response initial state into ResponseItem so
  // remounts don't show a stale "not voted" UI.
  const responseIds = responses.map(r => r.id)
  const { lookup: lookupVote } = useUserVotes({ responseIds })

  const submit = () => {
    if (!text.trim()) return
    createResponse.mutate(
      { body: text, isAnonymous: anon },
      { onSuccess: () => setText('') }
    )
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
        {respLoading ? '...' : responses.length} Response{responses.length !== 1 ? 's' : ''}
      </h2>

      {respLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <LoadingSpinner size={28} />
        </div>
      ) : responses.length === 0 ? (
        <EmptyState icon="💬" title="No responses yet" text="Be the first to help! Share what you know." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {responses.map(r => (
            <ResponseItem
              key={r.id}
              response={r}
              issueId={issueId}
              canMarkSolved={canMarkSolved}
              issueStatus={issueStatus}
              initialVote={lookupVote('response', r.id)}
            />
          ))}
        </div>
      )}

      {currentUser ? (
        <div className="card" style={{ border: '1.5px solid var(--border)', marginTop: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Add Your Response</h3>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <textarea
              className="form-input form-textarea" rows={4}
              placeholder="Share your experience, solution, or advice. Be specific — vague answers don't help."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} />
              <span style={{ color: 'var(--text-secondary)' }}>Post anonymously</span>
            </label>
            <Button onClick={submit} disabled={!text.trim() || createResponse.isPending}>
              {createResponse.isPending
                ? <><LoadingSpinner size={14} color="white" /> Posting...</>
                : 'Post Response'
              }
            </Button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 28, background: 'var(--surface-2)', marginTop: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Sign in to respond and help this corper
          </p>
        </div>
      )}
    </div>
  )
}
