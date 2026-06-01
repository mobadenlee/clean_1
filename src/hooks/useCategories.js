import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Local fetch — kept inline rather than in lib/queries.js so the read
// stays scoped to the calling component's auth session.
async function loadCategories() {
  const { data, error } = await supabase
    .from('issue_categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn:  loadCategories,
    staleTime: 5 * 60 * 1000,  // 5 minutes — categories rarely change
    gcTime:    10 * 60 * 1000, // keep in cache for 10 minutes
    retry: 3,
  })
}
