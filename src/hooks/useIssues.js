import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchIssues, fetchIssueById, createIssue, markIssueSolvedQuery, incrementViewCount } from '../lib/queries'
import { useApp } from '../context/AppContext'

export const issueKeys = {
  all:        ()        => ['issues'],
  list:       (filters) => ['issues', 'list', filters],
  infinite:   (filters) => ['issues', 'infinite', filters],
  detail:     (id)      => ['issues', 'detail', id],
}

export function useIssues(filters = {}) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn:  () => fetchIssues(filters),
    staleTime: 30_000,
  })
}

const PAGE_SIZE = 20

/**
 * Paginated cursor — used by long lists (feed, search results).
 *
 * Page index → range [page*PAGE_SIZE, (page+1)*PAGE_SIZE - 1]. We fetch
 * one extra row implicitly by comparing the returned length to PAGE_SIZE
 * to decide whether to expose a next page. (Supabase doesn't return a
 * total count unless we ask for it via head/count, which costs an extra
 * round-trip per page.)
 */
export function useInfiniteIssues(filters = {}) {
  return useInfiniteQuery({
    queryKey: issueKeys.infinite(filters),
    queryFn:  ({ pageParam = 0 }) =>
      fetchIssues({ ...filters, from: pageParam * PAGE_SIZE, to: pageParam * PAGE_SIZE + PAGE_SIZE - 1 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      (lastPage?.length ?? 0) < PAGE_SIZE ? undefined : allPages.length,
    staleTime: 30_000,
  })
}

// Per-session set of issue IDs already counted as views. Kept at module
// scope (outside React) so it survives component remounts and React Query
// refetches in the same tab. Without this guard, every refetch (focus
// revalidation, stale refresh, navigating back to the page) would inflate
// view_count — a single user reloading three times would show as 3 views.
const _viewedThisSession = new Set()

export function useIssue(id) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn:  async () => {
      const issue = await fetchIssueById(id)
      if (id && !_viewedThisSession.has(id)) {
        _viewedThisSession.add(id)
        incrementViewCount(id)
      }
      return issue
    },
    enabled:   !!id,
    staleTime: 10_000,
  })
}

export function useCreateIssue() {
  const queryClient   = useQueryClient()
  const { showToast } = useApp()

  return useMutation({
    mutationFn: (payload) => createIssue(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all() })
    },
    onError: (err) => {
      showToast(err.message || 'Failed to post issue.', 'error')
    },
  })
}

export function useMarkSolved() {
  const queryClient   = useQueryClient()
  const { showToast } = useApp()

  return useMutation({
    mutationFn: ({ issueId, responseId }) => markIssueSolvedQuery(issueId, responseId),
    onSuccess: (_data, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) })
      queryClient.invalidateQueries({ queryKey: issueKeys.all() })
      showToast('Issue marked as solved! 🎉', 'success')
    },
    onError: (err) => showToast(err.message, 'error'),
  })
}
