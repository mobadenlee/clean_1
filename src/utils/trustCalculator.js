import { AMBASSADOR_TRUST_THRESHOLD } from '../data/constants'

export const getTrustClass = (score) => {
  if (score >= 80) return 'trust-high'
  if (score >= 50) return 'trust-mid'
  return 'trust-low'
}

export const getTrustLabel = (score) => {
  if (score >= AMBASSADOR_TRUST_THRESHOLD) return 'Ambassador'
  if (score >= 60) return 'Trusted'
  if (score >= 40) return 'Active'
  return 'New Member'
}

export const pointsToAmbassador = (score) =>
  Math.max(0, AMBASSADOR_TRUST_THRESHOLD - score)

// Handles both user.trust (legacy) and user.trust_score (Supabase)
export const getTrustBreakdown = (user) => {
  const score = user?.trust_score ?? user?.trust ?? 0
  return [
    { label: 'Response Accuracy',     value: Math.min(100, score + 29) },
    { label: 'Community Votes',       value: Math.min(100, score + 23) },
    { label: 'Issue Resolution Rate', value: Math.min(100, score + 17) },
    { label: 'Response Streak',       value: Math.min(100, score + 11) },
  ]
}

export const formatTrustDelta = (delta) =>
  delta >= 0 ? `+${delta}` : `${delta}`
