import { useState, useEffect, useCallback } from 'react'

// localStorage key. Per-browser, per-device by design — the cost of a user
// seeing onboarding twice if they switch devices is much smaller than the
// cost of a DB migration for cosmetic state.
const KEY = 'nysc-onboarded-v1'

/**
 * useOnboarding — tracks whether the current user has seen onboarding,
 * and exposes step state so the dashboard can mount modal → tour in order.
 *
 * Returns:
 *   - step: 'modal' | 'tour' | 'done'
 *   - completeModal()  — call when the welcome modal is dismissed
 *   - completeTour()   — call when the tooltip tour finishes / is skipped
 *
 * Notes:
 * - The key is versioned ('-v1'). If you ever rework onboarding and want
 *   to re-show it to existing users, bump to '-v2'.
 * - Reads localStorage exactly once on mount, then state lives in React.
 *   Don't try to "sync" with other tabs — onboarding is a one-shot event,
 *   not ongoing state.
 */
export function useOnboarding() {
  const [step, setStep] = useState('done')

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(KEY)
      if (!seen) setStep('modal')
    } catch {
      // localStorage disabled (private mode, embedded contexts). Skip
      // onboarding silently rather than risk crashing the app.
      setStep('done')
    }
  }, [])

  const completeModal = useCallback(() => {
    // After the modal, advance to the tour. The tour itself is rendered
    // only on desktop (small viewports skip it), so on mobile this will
    // briefly be 'tour' and immediately complete itself — that's fine,
    // the tour component handles its own viewport check.
    setStep('tour')
  }, [])

  const completeTour = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, new Date().toISOString())
    } catch {
      // ignore
    }
    setStep('done')
  }, [])

  return { step, completeModal, completeTour }
}
