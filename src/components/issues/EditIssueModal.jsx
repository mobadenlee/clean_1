import { useState } from 'react'
import Modal  from '../ui/Modal'
import Button from '../ui/Button'
import { CATEGORIES, STATES, URGENCY_LEVELS } from '../../data/constants'

/**
 * Edit-issue modal. Pre-fills with the issue's current values and saves via
 * the useEditIssue mutation passed in from the parent.
 *
 * Note on category: the issues table stores category_id (a UUID), but the
 * UI works with category names. We pass categoryId straight through if the
 * user doesn't change the category; if they do, the parent is responsible
 * for resolving name → id (categories list). To keep this modal simple and
 * avoid a brittle name→id lookup here, we only let the user edit title,
 * body, state, and urgency — the fields that don't require id resolution.
 * Category changes are intentionally out of scope for inline editing.
 */
export default function EditIssueModal({ isOpen, onClose, issue, onSave, saving }) {
  const [form, setForm] = useState({
    title:   issue?.title   ?? '',
    body:    issue?.body    ?? '',
    state:   issue?.state   ?? '',
    urgency: issue?.urgency ?? 'medium',
  })

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = () => {
    const updates = {
      title:   form.title.trim(),
      body:    form.body.trim(),
      state:   form.state || null,
      urgency: form.urgency,
    }
    if (!updates.title || !updates.body) return // basic guard; UI also disables
    onSave(updates)
  }

  const valid = form.title.trim() && form.body.trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Issue" maxWidth={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={form.title}
            onChange={set('title')}
            placeholder="Issue title"
          />
        </div>

        <div>
          <label className="form-label">Details</label>
          <textarea
            className="form-input form-textarea"
            value={form.body}
            onChange={set('body')}
            rows={6}
            placeholder="Describe the issue"
          />
        </div>

        <div className="form-row" style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">State</label>
            <select className="form-input form-select" value={form.state} onChange={set('state')}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Urgency</label>
            <select className="form-input form-select" value={form.urgency} onChange={set('urgency')}>
              {URGENCY_LEVELS.map((u) => (
                <option key={u} value={u.toLowerCase()}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !valid}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
