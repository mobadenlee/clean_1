function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function roleColor(role) {
  const map = { ambassador: '#2F5BE8', moderator: '#7C3AED', admin: '#DC2626', member: '#0D9488' }
  return map[role] ?? '#9BA8BE'
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export function normalizeIssue(raw) {
  if (!raw) return null
  const author = raw.author ?? {}
  const isAnon = raw.is_anonymous || !author.id

  return {
    ...raw,
    // IssueCard field aliases
    description: raw.body ?? '',           // IssueCard reads issue.description
    upvotes:     raw.upvote_count   ?? 0,
    responses:   raw.response_count ?? 0,
    views:       raw.view_count     ?? 0,
    createdAt:   raw.created_at?.slice(0, 10) ?? '',
    solved:      raw.status === 'solved',
    urgency:     capitalize(raw.urgency ?? 'medium'),
    category:    raw.category?.name ?? '',
    author: {
      ...author,
      name:       isAnon ? 'Anonymous' : (author.full_name ?? 'Unknown'),
      initials:   isAnon ? 'AN' : getInitials(author.full_name),
      color:      isAnon ? '#9BA8BE' : roleColor(author.role),
      trust:      author.trust_score ?? 0,
      ambassador: ['ambassador', 'moderator', 'admin'].includes(author.role),
    },
  }
}

export function normalizeUser(u) {
  if (!u) return null
  return {
    initials: getInitials(u.full_name ?? 'NH'),
    color:    roleColor(u.role),
    ...u,
  }
}
