import { supabase } from './supabase'

const PROFILE_FIELDS = `id, username, full_name, avatar_url, role, trust_score, state, batch`

// ── ISSUES ────────────────────────────────────────────────────────────────────

export async function fetchIssues({
  category,
  state,
  urgency,
  status,
  search,
  sortKey,
  authorId,
  from,
  to,
} = {}) {
  let query = supabase
    .from('issues')
    .select(`
      id, title, body, state, lga, urgency, status, author_id,
      is_anonymous, view_count, response_count, upvote_count,
      created_at, updated_at, tags,
      author:profiles!author_id(${PROFILE_FIELDS}),
      category:issue_categories(id, slug, name)
    `)

  if (status && status !== 'All') query = query.eq('status', status.toLowerCase())
  else                            query = query.neq('status', 'flagged')

  if (category && category !== 'All' && category !== '') query = query.eq('issue_categories.name', category)
  if (state    && state    !== '')                       query = query.eq('state', state)
  if (urgency  && urgency  !== 'All')                    query = query.eq('urgency', urgency.toLowerCase())
  if (authorId)                                          query = query.eq('author_id', authorId)
  if (search   && search.trim())                         query = query.textSearch('search_vector', search.trim(), { type: 'websearch' })

  if      (sortKey === 'upvotes')   query = query.order('upvote_count',   { ascending: false })
  else if (sortKey === 'responses') query = query.order('response_count', { ascending: false })
  else                              query = query.order('created_at',     { ascending: false })

  // Pagination — pass [from, to] inclusive indices, e.g. [0, 19] for the first page of 20.
  // Omit both for "give me everything" (legacy callers).
  if (typeof from === 'number' && typeof to === 'number') {
    query = query.range(from, to)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchIssueById(id) {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      id, title, body, state, lga, urgency, status,
      is_anonymous, view_count, response_count, upvote_count,
      created_at, updated_at, tags, solved_at, solved_response_id,
      author:profiles!author_id(${PROFILE_FIELDS}),
      category:issue_categories(id, slug, name)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createIssue(payload) {
  const { data, error } = await supabase
    .from('issues')
    .insert(payload)
    .select('id, title, status, created_at')
    .single()
  if (error) throw error
  return data
}

export async function markIssueSolvedQuery(issueId, solvedResponseId) {
  const { data, error } = await supabase
    .from('issues')
    .update({
      status:             'solved',
      solved_response_id: solvedResponseId,
      solved_at:          new Date().toISOString(),
    })
    .eq('id', issueId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Fire-and-forget. We intentionally don't await — the issue page renders
// before the count round-trips. Catch the rejection so a failed RPC doesn't
// show up as an unhandled-promise warning in the console.
export function incrementViewCount(issueId) {
  supabase.rpc('increment_view_count', { issue_id: issueId }).then(
    () => {},
    () => {},
  )
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('issue_categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

// ── RESPONSES ─────────────────────────────────────────────────────────────────

export async function fetchResponses(issueId) {
  const { data, error } = await supabase
    .from('responses')
    .select(`
      id, issue_id, body, is_anonymous, is_best_answer,
      is_ambassador_response, upvote_count, created_at,
      author:profiles!author_id(${PROFILE_FIELDS})
    `)
    .eq('issue_id', issueId)
    .order('is_best_answer', { ascending: false })
    .order('upvote_count',   { ascending: false })
    .order('created_at',     { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createResponse({ issueId, body, isAnonymous, authorId }) {
  // is_ambassador_response is server-managed: the trg_response_ambassador
  // trigger overwrites it based on the author's real profile.role. We
  // omit it from the insert payload so the intent is obvious from the code.
  const { data, error } = await supabase
    .from('responses')
    .insert({
      issue_id:     issueId,
      author_id:    authorId,
      body,
      is_anonymous: isAnonymous ?? false,
    })
    .select(`
      id, issue_id, body, is_anonymous, is_best_answer,
      is_ambassador_response, upvote_count, created_at,
      author:profiles!author_id(${PROFILE_FIELDS})
    `)
    .single()
  if (error) throw error
  return data
}

export async function markBestAnswerQuery(responseId, issueId) {
  await supabase
    .from('responses')
    .update({ is_best_answer: false })
    .eq('issue_id', issueId)
    .eq('is_best_answer', true)

  const { data, error } = await supabase
    .from('responses')
    .update({ is_best_answer: true })
    .eq('id', responseId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── VOTES ─────────────────────────────────────────────────────────────────────

export async function castVoteQuery({ issueId, responseId, userId }) {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      user_id:     userId,
      issue_id:    issueId    ?? null,
      response_id: responseId ?? null,
      vote_type:   'upvote',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeVoteQuery(voteId) {
  const { error } = await supabase.from('votes').delete().eq('id', voteId)
  if (error) throw error
}

export async function fetchUserVotesQuery(userId, issueIds = [], responseIds = []) {
  if (!userId) return []
  let query = supabase
    .from('votes')
    .select('id, issue_id, response_id')
    .eq('user_id', userId)
  if (issueIds.length)    query = query.in('issue_id',    issueIds)
  if (responseIds.length) query = query.in('response_id', responseIds)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── SAVED ISSUES ──────────────────────────────────────────────────────────────

export async function fetchSavedIssues(userId) {
  const { data, error } = await supabase
    .from('saved_issues')
    .select(`issue:issues(
      id, title, state, urgency, status,
      response_count, upvote_count, created_at, is_anonymous,
      author:profiles!author_id(${PROFILE_FIELDS}),
      category:issue_categories(name)
    )`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => r.issue).filter(Boolean)
}

export async function saveIssueQuery(issueId, userId) {
  const { error } = await supabase
    .from('saved_issues')
    .insert({ user_id: userId, issue_id: issueId })
  if (error && error.code !== '23505') throw error
}

export async function unsaveIssueQuery(issueId, userId) {
  const { error } = await supabase
    .from('saved_issues')
    .delete()
    .eq('user_id', userId)
    .eq('issue_id', issueId)
  if (error) throw error
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export async function fetchNotifications(userId, limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, type, title, body, is_read, created_at, metadata,
      actor:profiles!actor_id(full_name, avatar_url),
      issue:issues(id, title)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function markNotifReadQuery(notifId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notifId)
  if (error) throw error
}

export async function markAllNotifsReadQuery(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfileQuery(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchTopAmbassadors(limit = 5) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .in('role', ['ambassador', 'moderator', 'admin'])
    .order('trust_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchTrustEvents(userId, limit = 20) {
  const { data, error } = await supabase
    .from('trust_events')
    .select('id, event_type, delta, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchAmbassadorQueue() {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      id, title, state, urgency, status,
      response_count, upvote_count, view_count, created_at,
      author:profiles!author_id(${PROFILE_FIELDS}),
      category:issue_categories(name)
    `)
    .eq('status', 'open')
    .in('urgency', ['critical', 'high'])
    .order('urgency',    { ascending: true })
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) throw error
  return data ?? []
}
