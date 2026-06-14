import Modal  from './Modal'
import Button from './Button'

/**
 * Confirmation dialog for destructive actions (delete, etc.).
 *
 * Props:
 *   isOpen, onClose
 *   title       — heading (e.g. "Delete issue?")
 *   message     — body text explaining consequences
 *   confirmText — label for the destructive button (default "Delete")
 *   onConfirm   — called when confirmed
 *   busy        — disables buttons while the action is in flight
 */
export default function ConfirmModal({
  isOpen, onClose, title, message,
  confirmText = 'Delete', onConfirm, busy = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={420}>
      <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmText}
        </Button>
      </div>
    </Modal>
  )
}
