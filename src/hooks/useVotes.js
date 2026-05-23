import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { castVoteQuery, removeVoteQuery, fetchUserVotesQuery } from '../lib/queries'
import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'

export const voteKeys = {
  forUser: (userId, issueIds, responseIds) =>
    ['user-votes', userId, [...issueIds].sort(), [...responseIds].sort()],
}

/**
 * Fetch the current user's existing votes for a set of issues/responses
 * in one query. Components render a list, collect the IDs, pass them to
 * this hook, and feed the per-item result into useVote() as initial state.
 *
 * Returns a Map keyed by `issue:<id>` / `response:<id>` → { id }, so
 * lookups are O(1) without indexing by both fields.
 */
export function useUserVotes({ issueIds = [], responseIds = [] } = {}) {
  const { currentUser } = useAuth()
  const userId          = currentUser?.id

  const { data = [] } = useQuery({
    queryKey: voteKeys.forUser(userId, issueIds, responseIds),
    queryFn:  () => fetchUserVotesQuery(userId, issueIds, responseIds),
    enabled:  !!userId && (issueIds.length > 0 || responseIds.length > 0),
    staleTime: 30_000,
  })

  const map = new Map()
  for (const v of data) {
    if (v.issue_id)    map.set(`issue:${v.issue_id}`,       { id: v.id })
    if (v.response_id) map.set(`response:${v.response_id}`, { id: v.id })
  }

  const lookup = (type, targetId) => map.get(`${type}:${targetId}`) ?? null
  return { lookup }
}

/**
 * Track and toggle a vote on a single issue or response.
 *
 * Previously the hook stored `voted`/`voteId` purely in component state,
 * so remounts (route change, parent re-render unmount, …) would reset them
 * to `false`/`null`. Users could re-cast a vote they'd already cast until
 * the DB returned 23505 and the optimistic UI rolled back.
 *
 * Now we accept `initialVoted` and `initialVoteId`, which list components
 * compute up-front via useUserVotes(). On remount, we re-seed from those.
 */
export function useVote({
  targetId,
  type,
  initialCount    = 0,
  initialVoted    = false,
  initialVoteId   = null,
}) {
  const { currentUser } = useAuth()
  const { showToast }   = useApp()

  const [voted,     setVoted]     = useState(initialVoted)
  const [voteId,    setVoteId]    = useState(initialVoteId)
  const [voteCount, setVoteCount] = useState(initialCount)
  const [loading,   setLoading]   = useState(false)

  // Re-seed when the server-side initial values change (e.g. useUserVotes
  // resolves after first render). Don't clobber an in-flight optimistic
  // update — only resync when we aren't loading.
  useEffect(() => { setVoteCount(initialCount) }, [initialCount])
  useEffect(() => {
    if (loading) return
    setVoted(initialVoted)
    setVoteId(initialVoteId)
  }, [initialVoted, initialVoteId, loading])

  const toggle = useCallback(async () => {
    if (!currentUser) { showToast('Sign in to vote.', 'info'); return }
    if (loading) return

    const wasVoted = voted
    // Optimistic update
    setVoted(!wasVoted)
    setVoteCount(c => wasVoted ? c - 1 : c + 1)
    setLoading(true)

    try {
      if (wasVoted && voteId) {
        await removeVoteQuery(voteId)
        setVoteId(null)
      } else {
        const data = await castVoteQuery({
          issueId:    type === 'issue'    ? targetId : null,
          responseId: type === 'response' ? targetId : null,
          userId:     currentUser.id,
        })
        setVoteId(data.id)
      }
    } catch (err) {
      // Rollback
      setVoted(wasVoted)
      setVoteCount(c => wasVoted ? c + 1 : c - 1)
      showToast(
        err.code === '23505' ? 'You already voted on this.' : 'Vote failed. Try again.',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }, [currentUser, loading, voted, voteId, targetId, type, showToast])

  return { voted, setVoted, voteCount, setVoteCount, toggle, loading, setVoteId }
}
