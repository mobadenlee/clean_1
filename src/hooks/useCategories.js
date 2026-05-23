import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Fetch categories directly — bypasses the fetchCategories helper
// so we can use the current auth session headers automatically
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
