import { useState }       from 'react'
import { useNavigate }     from 'react-router-dom'
import { useCreateIssue }  from '../../hooks/useIssues'
import { useCategories }   from '../../hooks/useCategories'
import { useAuth }         from '../../context/AuthContext'
import { STATES, URGENCY_LEVELS } from '../../data/constants'
import { validateIssueForm }      from '../../utils/validators'
import Button                     from '../ui/Button'
import LoadingSpinner             from '../ui/LoadingSpinner'

const EMPTY = { title: '', categoryId: '', state: '', lga: '', urgency: 'Medium', description: '', anonymous: false }

export default function PostIssueForm() {
  const navigate       = useNavigate()
  const { currentUser } = useAuth()
  const createIssue    = useCreateIssue()
  const { data: categories = [] } = useCategories()

  const [form,    setForm]    = useState(EMPTY)
  const [errors,  setErrors]  = useState({})
  const [success, setSuccess] = useState(null)

  const set = (field) => (e) => {
    setErrors(p => ({ ...p, [field]: '' }))
    setForm(p => ({ ...p, [field]: e.target.value }))
  }

  const submit = () => {
    // Validate using the description field mapped to body
    const errs = validateIssueForm({ ...form, category: form.categoryId, description: form.description })
    if (Object.keys(errs).length) { setErrors(errs); return }

    createIssue.mutate(
      {
        title:        form.title,
        body:         form.description,
        category_id:  form.categoryId || null,
        state:        form.state,
        lga:          form.lga || null,
        urgency:      form.urgency.toLowerCase(),
        is_anonymous: form.anonymous,
        author_id:    currentUser?.id,
        tags:         [],
      },
      {
        onSuccess: (data) => { setSuccess(data); setForm(EMPTY) },
      }
    )
  }

  // Success screen
  if (success) return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
        Issue Posted Successfully!
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
        Your issue has been submitted. Verified Ambassadors and community members have been notified.
      </p>
      <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>What happens next?</h3>
        {[
          'Ambassadors in your state will be notified',
          'Community members can upvote and respond',
          'You\'ll get notified of all responses',
          'You can mark the best answer as solved',
        ].map((t, i) => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={() => setSuccess(null)}>Post Another</Button>
        <Button onClick={() => navigate(`/issue/${success.id}`)}>View My Issue →</Button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(47,91,232,0.15)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
        💡 <strong>Tip:</strong> Be specific about your state, LGA, and what you've already tried. This dramatically increases your chances of a helpful answer.
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Issue Title *</label>
            <input className="form-input" placeholder="e.g., 'PPA rejected me after official posting in Lagos'" value={form.title} onChange={set('title')} />
            {errors.title && <span className="form-error">{errors.title}</span>}
            <span className="form-hint">Be specific and concise. Good titles get faster responses.</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input form-select" value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Urgency Level</label>
              <select className="form-input form-select" value={form.urgency} onChange={set('urgency')}>
                {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">State *</label>
              <select className="form-input form-select" value={form.state} onChange={set('state')}>
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span className="form-error">{errors.state}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Local Government Area</label>
              <input className="form-input" placeholder="e.g., Ikeja, Abeokuta South" value={form.lga} onChange={set('lga')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Describe Your Issue *</label>
            <textarea
              className="form-input form-textarea" rows={6}
              placeholder="Provide full context: What happened? When? What have you already tried? What documents do you have? The more detail, the better your responses."
              value={form.description} onChange={set('description')}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
            <span className="form-hint">
              {form.description.length} characters
              {form.description.length < 50 && ` (${50 - form.description.length} more needed)`}
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <input type="checkbox" checked={form.anonymous} onChange={e => setForm(p => ({ ...p, anonymous: e.target.checked }))} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Post anonymously</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your name won't be shown, but your issue will still receive full community support.</div>
            </div>
          </label>

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={submit} disabled={createIssue.isPending} style={{ flex: 1 }}>
              {createIssue.isPending
                ? <><LoadingSpinner size={14} color="white" /> Posting...</>
                : 'Post Issue →'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
