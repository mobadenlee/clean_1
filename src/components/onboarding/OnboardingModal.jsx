import { useEffect } from 'react';
import Icon from './Icon';

/**
 * Simple accessible modal overlay.
 *
 * Locks body scroll while open so the page doesn't scroll behind the
 * backdrop, and allows the modal wrapper itself to scroll if the content
 * is taller than the viewport (rare but possible on small screens).
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  // Close on Escape key + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);

    // Lock body scroll. Save the previous overflow value so we restore
    // it exactly on unmount (handles nested modals correctly if we ever
    // add them).
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 20,
        // Allow the overlay itself to scroll if content is taller than
        // viewport — content will scroll INSIDE the modal area rather
        // than pushing the modal off-screen.
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-in"
        style={{
          width: '100%',
          maxWidth,
          boxShadow: 'var(--shadow-lg)',
          // Ensure modal stays within viewport vertically with margin.
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
              {title}
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
