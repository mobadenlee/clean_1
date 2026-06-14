import { useState, useRef, useEffect } from 'react'

/**
 * Three-dots (⋯) actions menu for a post (issue or response).
 *
 * Render this only for posts the current user owns — it does not check
 * ownership itself; the parent decides whether to render it. Keeping the
 * ownership check in the parent avoids passing auth context into a tiny
 * presentational component.
 *
 * Props:
 *   onEdit()   — called when Edit is chosen
 *   onDelete() — called when Delete is chosen
 *
 * Closes on outside-click and on Escape.
 */
export default function PostActionsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (fn) => () => { setOpen(false); fn?.() }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label="Post actions"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, lineHeight: 1, padding: '2px 8px',
          color: 'var(--text-muted)', borderRadius: 6,
        }}
      >
        &#8943;{/* horizontal ellipsis ⋯ */}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            minWidth: 140, background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e5e7eb)', borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.14)', zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={choose(onEdit)}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={choose(onDelete)}
            style={{ ...menuItemStyle, color: 'var(--red, #DC2626)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'transparent', border: 'none', cursor: 'pointer',
  padding: '10px 14px', fontSize: 14, color: 'var(--text-primary, #0D1117)',
}
