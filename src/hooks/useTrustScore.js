import { useMemo } from 'react'
import { AMBASSADOR_TRUST_THRESHOLD } from '../data/constants'
import { getTrustClass } from '../utils/trustCalculator'

// Lightweight derived-state hook for trust UI. All thresholds and class
// mappings come from a single source of truth: AMBASSADOR_TRUST_THRESHOLD
// (constants.js) for the ambassador bar, and getTrustClass (trustCalculator)
// for the visual tier. Don't hardcode numbers here.
export function useTrustScore(user) {
  return useMemo(() => {
    const score = user?.trust_score ?? user?.trust ?? 0
    return {
      trustClass:           getTrustClass(score),
      toAmbassador:         Math.max(0, AMBASSADOR_TRUST_THRESHOLD - score),
      isAmbassadorEligible: score >= AMBASSADOR_TRUST_THRESHOLD,
    }
  }, [user])
}
