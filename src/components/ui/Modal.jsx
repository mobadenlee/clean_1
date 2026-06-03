import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * Simple accessible modal overlay.
 *
 * Renders into a portal at document.body so `position: fixed` is relative
 * to the viewport — not to any ancestor that has a CSS transform/filter/
 * perspective set (e.g. our `.page-content.animate-in` uses transform,
 * which would otherwise capture the fixed positioning and cause the modal
 * to render off-viewport).
 *
 * Locks body scroll while open so the page doesn't scroll behind the
 * backdrop.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  // Close on Escape key + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const overlay = (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 20,
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

  return createPortal(overlay, document.body);
}
