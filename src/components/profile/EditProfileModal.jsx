import { useState } from 'react'
import Modal             from '../ui/Modal'
import Button            from '../ui/Button'
import { useUpdateProfile } from '../../hooks/useProfile'
import { STATES, BATCHES } from '../../data/constants'

/**
 * Edit-profile modal. Lets the signed-in user update the fields the app
 * actually owns on their profile row: full_name, state, batch, avatar_url.
 *
 * role and trust_score are intentionally NOT editable — role is pinned by a
 * DB trigger, and trust_score is system-managed.
 *
 * Saving calls useUpdateProfile() → updateProfileQuery (governed by the
 * profiles_update_own RLS policy), then refreshProfile() so the sidebar and
 * profile page update immediately.
 */
export default function EditProfileModal({ isOpen, onClose, currentUser }) {
  const update = useUpdateProfile()

  const [form, setForm] = useState({
    full_name:  currentUser?.full_name  ?? '',
    state:      currentUser?.state      ?? '',
    batch:      currentUser?.batch      ?? '',
    avatar_url: currentUser?.avatar_url ?? '',
  })

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    // Trim and send only the editable fields. Empty strings become null so
    // we don't store blank text where the DB expects null.
    const updates = {
      full_name:  form.full_name.trim() || null,
      state:      form.state            || null,
      batch:      form.batch            || null,
      avatar_url: form.avatar_url.trim() || null,
    }
    try {
      await update.mutateAsync(updates)
      onClose()
    } catch {
      // useUpdateProfile already surfaces the error via a toast.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            value={form.full_name}
            onChange={set('full_name')}
            placeholder="Your full name"
          />
        </div>

        <div className="form-row">
          <div>
            <label className="form-label">Deployment State</label>
            <select className="form-input form-select" value={form.state} onChange={set('state')}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Batch</label>
            <select className="form-input form-select" value={form.batch} onChange={set('batch')}>
              <option value="">Select batch</option>
              {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Avatar URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            className="form-input"
            value={form.avatar_url}
            onChange={set('avatar_url')}
            placeholder="https://..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
