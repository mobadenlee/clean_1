import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSavedIssues, saveIssueQuery, unsaveIssueQuery } from '../lib/queries'
import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'

export const savedKeys = {
  all: (userId) => ['saved-issues', userId],
}

export function useSavedIssues() {
  const { currentUser } = useAuth()
  const userId = currentUser?.id

  return useQuery({
    queryKey: savedKeys.all(userId),
    queryFn:  () => fetchSavedIssues(userId),
    enabled:  !!userId,
    staleTime: 30_000,
  })
}

export function useToggleSaved() {
  const queryClient     = useQueryClient()
  const { currentUser } = useAuth()
  const { showToast }   = useApp()

  return useMutation({
    mutationFn: async ({ issueId, isSaved }) => {
      if (!currentUser) throw new Error('Not authenticated')
      if (isSaved) await unsaveIssueQuery(issueId, currentUser.id)
      else          await saveIssueQuery(issueId, currentUser.id)
      return { issueId, isSaved }
    },
    onSuccess: ({ isSaved }) => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all(currentUser?.id) })
      showToast(isSaved ? 'Removed from saved' : 'Issue saved!', isSaved ? 'info' : 'success')
    },
    onError: (err) => showToast(err.message, 'error'),
  })
}

// Convenience: check if a specific issue is saved from the cached list
export function useIsSaved(issueId) {
  const { data: savedIssues = [] } = useSavedIssues()
  return savedIssues.some(i => i.id === issueId)
}
