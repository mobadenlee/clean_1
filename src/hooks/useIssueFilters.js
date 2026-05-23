import { useState } from 'react'

// Manages filter/sort state only.
// Actual filtering happens server-side via useIssues(filters).
export function useIssueFilters() {
  const [category, setCategory] = useState('All')
  const [urgency,  setUrgency]  = useState('All')
  const [status,   setStatus]   = useState('All')
  const [state,    setState]    = useState('')
  const [query,    setQuery]    = useState('')
  const [sortKey,  setSortKey]  = useState('recent')

  const reset = () => {
    setCategory('All')
    setUrgency('All')
    setStatus('All')
    setState('')
    setQuery('')
    setSortKey('recent')
  }

  return {
    category, setCategory,
    urgency,  setUrgency,
    status,   setStatus,
    state,    setState,
    query,    setQuery,
    sortKey,  setSortKey,
    reset,
  }
}
