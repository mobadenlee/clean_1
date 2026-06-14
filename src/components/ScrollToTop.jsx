import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll position to the top whenever the route (pathname) changes.
 *
 * In a single-page app, navigating between routes doesn't trigger a real
 * browser page load, so the browser's native "scroll to top on navigation"
 * behavior never fires — the new page opens at whatever scroll position the
 * previous one was left at. This component restores the expected behavior.
 *
 * Renders nothing. Mount it once inside the Router, above the routes.
 *
 * Notes:
 * - Keyed on pathname only (not search/hash), so changing query params or
 *   jumping to an in-page #anchor won't force a scroll-to-top.
 * - The app scrolls via the window (layout containers use min-height:100vh,
 *   not overflow:auto), so window.scrollTo is correct here. If a future
 *   layout change makes an inner container the scroller, this would need to
 *   target that element instead.
 * - 'instant' avoids a distracting smooth-scroll animation on every nav.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
