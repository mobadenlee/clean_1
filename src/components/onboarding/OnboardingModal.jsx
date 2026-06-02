import { useState } from 'react'
import Modal  from '../ui/Modal'
import Button from '../ui/Button'

/**
 * 3-screen welcome modal for brand-new users. Mounted once by DashboardHome
 * when useOnboarding's step === 'modal'. Calls onComplete() when the user
 * finishes the last step or hits Skip — the parent then advances to the
 * tooltip tour.
 *
 * Content is deliberately short. Onboarding people hate to read; the goal
 * is to set a brief value-prop, explain the social contract, and get out
 * of the way.
 */
const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to NYSC HelpDesk',
    body: 'A community where corps members help each other through PPA issues, clearance delays, allowance problems, and everything else NYSC throws at you.',
  },
  {
    emoji: '🤝',
    title: 'How it works',
    body: 'Post your issue with details. Other corps members and ambassadors will respond. Mark the best answer when your problem is solved — and earn trust as you help others.',
  },
  {
    emoji: '🚀',
    title: 'Get started',
    body: "You're all set. Have a quick look around — we'll point out a few things in a moment.",
  },
]

export default function OnboardingModal({ isOpen, onComplete }) {
  const [i, setI] = useState(0)
  const step    = STEPS[i]
  const isLast  = i === STEPS.length - 1

  // Closing the modal (X button, backdrop click) is treated as Skip —
  // we still advance to onComplete so the user isn't shown the modal
  // again on next visit. Skip ≠ ignore.
  const handleClose = () => onComplete()

  const handleNext = () => {
    if (isLast) onComplete()
    else setI(i + 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth={460}>
      <div style={{ textAlign: 'center', padding: '4px 8px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{step.emoji}</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 10,
        }}>{step.title}</h2>
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginBottom: 24,
          maxWidth: 380,
          margin: '0 auto 24px',
        }}>{step.body}</p>

        {/* Step indicator dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 20,
        }}>
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: idx === i ? 'var(--accent)' : 'var(--border, #e5e7eb)',
              }}
            />
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
        }}>
          {!isLast && (
            <Button variant="ghost" onClick={onComplete}>
              Skip
            </Button>
          )}
          <Button onClick={handleNext}>
            {isLast ? "Let's go" : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}