import { useState, useEffect, useLayoutEffect } from 'react'

/**
 * Lightweight tooltip tour. Highlights three UI elements in sequence
 * (Post Issue → Issue Feed → Search Issues) by reading data-onboard="..."
 * attributes from the DOM, positioning a tooltip near each target, and
 * advancing on Next.
 *
 * Why custom instead of a library:
 *   - No dependency cost (~50KB for react-joyride avoided)
 *   - Inherits your CSS tokens automatically (no theme integration work)
 *   - Won't break if the underlying UI changes — it just gracefully skips
 *     targets it can't find
 *
 * Desktop-only by design: tooltips rely on stable mouse-driven positioning
 * and many targets live in the sidebar, which is a collapsed drawer on
 * mobile. The mobile experience is just the welcome modal — no tooltips.
 */

const STEPS = [
  {
    target: 'post-issue',
    title:  'Post your first issue',
    body:   "When you have a problem, click here to ask the community.",
  },
  {
    target: 'feed',
    title:  'Browse the feed',
    body:   "See what other corps members are dealing with — you might find an answer that's already been given.",
  },
  {
    target: 'search',
    title:  'Search before you post',
    body:   "Common issues come up a lot. Searching first often saves you a wait.",
  },
]

// Desktop threshold matches the existing 900px breakpoint used by the
// AppShell to hide the desktop header and switch to the mobile layout.
const DESKTOP_MIN_WIDTH = 900

export default function OnboardingTour({ isActive, onComplete }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)

  // Don't render at all on mobile — auto-complete and exit. The hook
  // sequences modal → tour, so this just hands control back immediately.
  useEffect(() => {
    if (!isActive) return
    if (typeof window === 'undefined') return
    if (window.innerWidth < DESKTOP_MIN_WIDTH) {
      onComplete()
    }
  }, [isActive, onComplete])

  // Measure the current target on each step. useLayoutEffect because we
  // need the rect BEFORE paint so the tooltip doesn't flash in the wrong
  // position. Re-measure on window resize so the tooltip stays attached
  // if the user resizes mid-tour.
  useLayoutEffect(() => {
    if (!isActive) return
    if (window.innerWidth < DESKTOP_MIN_WIDTH) return

    const measure = () => {
      const step = STEPS[i]
      const el = document.querySelector(`[data-onboard="${step.target}"]`)
      if (!el) {
        // Target missing (page changed, element conditionally hidden).
        // Skip silently to the next step rather than show a tooltip
        // floating in space.
        setRect(null)
        return
      }
      setRect(el.getBoundingClientRect())
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [isActive, i])

  if (!isActive) return null
  if (typeof window === 'undefined') return null
  if (window.innerWidth < DESKTOP_MIN_WIDTH) return null

  const step = STEPS[i]
  const isLast = i === STEPS.length - 1

  const handleNext = () => {
    if (isLast) onComplete()
    else setI(i + 1)
  }

  // If the target couldn't be found, render a centered fallback so the
  // user can still advance — rather than getting stuck.
  const fallbackToCenter = !rect

  // Position tooltip below the target by default. If it would clip the
  // viewport bottom, flip it above. Same for left/right.
  const TOOLTIP_WIDTH = 280
  const TOOLTIP_HEIGHT_EST = 140
  const GAP = 12

  let top, left
  if (fallbackToCenter) {
    top  = (window.innerHeight - TOOLTIP_HEIGHT_EST) / 2
    left = (window.innerWidth  - TOOLTIP_WIDTH) / 2
  } else {
    const wouldClipBottom = rect.bottom + GAP + TOOLTIP_HEIGHT_EST > window.innerHeight
    top = wouldClipBottom
      ? rect.top - GAP - TOOLTIP_HEIGHT_EST
      : rect.bottom + GAP

    // Center horizontally on target, then clamp to viewport with 12px padding.
    left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
    left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 12))
  }

  return (
    <>
      {/* Dim overlay. Clicking it acts as Skip — same as the modal pattern. */}
      <div
        onClick={onComplete}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          zIndex: 290,
        }}
      />

      {/* Spotlight ring around the target. Subtle pulse via CSS keyframes
          isn't worth the complexity here; a static highlight reads fine. */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top:    rect.top - 6,
            left:   rect.left - 6,
            width:  rect.width + 12,
            height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 4px var(--accent), 0 0 0 9999px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
            zIndex: 291,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: 'fixed',
          top,
          left,
          width: TOOLTIP_WIDTH,
          background: 'var(--surface, white)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          zIndex: 292,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
          {step.body}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: idx === i ? 'var(--accent)' : 'var(--border, #e5e7eb)',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onComplete}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: 13,
                cursor: 'pointer', padding: '6px 10px',
              }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{
                background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}