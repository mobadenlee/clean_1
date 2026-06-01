import { AMBASSADOR_TRUST_THRESHOLD } from '../data/constants'

// 5-level trust scheme. Thresholds: 0 / 25 / 75 / 200 / 500.
// AMBASSADOR_TRUST_THRESHOLD (=500) gates the top label but does NOT
// automatically grant the ambassador role — role changes are admin-only
// (enforced by the prevent_role_change DB trigger). Reaching 500 makes a
// user eligible; promotion happens out-of-band.

export const getTrustClass = (score) => {
  if (score >= 200) return 'trust-high'
  if (score >=  75) return 'trust-mid'
  return 'trust-low'
}

export const getTrustLabel = (score) => {
  if (score >= AMBASSADOR_TRUST_THRESHOLD) return 'Eligible for Ambassador'
  if (score >= 200) return 'Senior Member'
  if (score >=  75) return 'Trusted Member'
  if (score >=  25) return 'Contributor'
  return 'New Member'
}

export const pointsToAmbassador = (score) =>
  Math.max(0, AMBASSADOR_TRUST_THRESHOLD - score)

// Trust breakdown by sub-metric. Sourced from real trust_events (set up by
// the Schema 3 migration) rather than fabricated. Accepts either an array of
// trust events for the user, or — for backward compatibility with the
// previous signature — a user object whose .trustEvents we read.
//
// Returns each bucket as a percentage of total positive points earned, so
// the breakdown bars are comparative (their values sum to 100) regardless of
// how high the absolute score is. Returns [] when there are no events to
// show, which the UI renders as an honest "not available yet" placeholder.
export const getTrustBreakdown = (userOrEvents) => {
  const events = Array.isArray(userOrEvents)
    ? userOrEvents
    : (userOrEvents?.trustEvents ?? [])

  if (!events.length) return []

  // Sum positive deltas only — negative events (e.g. an upvote being removed)
  // cancel out a prior award but shouldn't appear as their own "category."
  const sumPositive = (type) =>
    events
      .filter(e => e.event_type === type && (e.delta || 0) > 0)
      .reduce((s, e) => s + e.delta, 0)

  const buckets = [
    { label: 'Best Answers',     value: sumPositive('best_answer_marked') },
    { label: 'Response Upvotes', value: sumPositive('response_upvoted') },
    { label: 'Issue Upvotes',    value: sumPositive('issue_upvoted') },
    { label: 'Participation',    value: sumPositive('response_posted') },
  ]

  const total = buckets.reduce((s, b) => s + b.value, 0)
  if (total <= 0) return []

  return buckets
    .filter(b => b.value > 0)
    .map(b => ({ label: b.label, value: Math.round((b.value / total) * 100) }))
}

export const formatTrustDelta = (delta) =>
  delta >= 0 ? `+${delta}` : `${delta}`
