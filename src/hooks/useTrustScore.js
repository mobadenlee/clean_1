import { useMemo } from 'react'

const AMBASSADOR_THRESHOLD = 80

function getTrustClass(score) {
  if (score >= 80) return 'trust-high'
  if (score >= 50) return 'trust-mid'
  return 'trust-low'
}

export function useTrustScore(user) {
  return useMemo(() => {
    const score = user?.trust_score ?? user?.trust ?? 0
    return {
      trustClass:           getTrustClass(score),
      toAmbassador:         Math.max(0, AMBASSADOR_THRESHOLD - score),
      isAmbassadorEligible: score >= AMBASSADOR_THRESHOLD,
    }
  }, [user])
}
