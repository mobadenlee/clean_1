import { useEffect } from 'react';
import Icon from './Icon';

/**
 * Simple accessible modal overlay.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        z: 300, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card animate-in"
        style={{ width: '100%', maxWidth, boxShadow: 'var(--shadow-lg)' }}
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
