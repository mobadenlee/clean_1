import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase }  from '../lib/supabase'
import { fetchResponses, createResponse, markBestAnswerQuery,
         updateResponseQuery, deleteResponseQuery } from '../lib/queries'
import { useApp }  from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export const responseKeys = {
  byIssue: (issueId) => ['responses', issueId],
}

export function useResponses(issueId) {
  const queryClient = useQueryClient()

  // Realtime: invalidate whenever a new response lands on this issue.
  //
  // React 18 Strict Mode (enabled in main.jsx) runs effects twice in dev.
  // If both mounts use the same channel name (`responses-${issueId}`), the
  // first cleanup removes a channel the second mount is still subscribing
  // to — events get dropped. Adding a per-mount random suffix gives each
  // effect its own channel object, and the matching removeChannel call
  // only touches *its* channel.
  useEffect(() => {
    if (!issueId) return
    const channelName = `responses-${issueId}-${
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    }`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'responses',
        filter: `issue_id=eq.${issueId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: responseKeys.byIssue(issueId) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [issueId, queryClient])

  return useQuery({
    queryKey: responseKeys.byIssue(issueId),
    queryFn:  () => fetchResponses(issueId),
    enabled:  !!issueId,
    staleTime: 0,
  })
}

export function useCreateResponse(issueId) {
  const queryClient     = useQueryClient()
  const { showToast }   = useApp()
  const { currentUser } = useAuth()

  return useMutation({
    mutationFn: ({ body, isAnonymous }) =>
      createResponse({
        issueId,
        body,
        isAnonymous,
        authorId: currentUser?.id,
        // is_ambassador_response is now set server-side by the
        // trg_response_ambassador trigger (see 0001_init.sql) based on
        // the author's real profile.role. We intentionally don't pass
        // it from the client — a malicious client could otherwise set it
        // to true regardless of their actual role.
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.byIssue(issueId) })
      showToast('Response posted!', 'success')
    },
    onError: (err) => showToast(err.message || 'Failed to post response.', 'error'),
  })
}

export function useMarkBestAnswer(issueId) {
  const queryClient   = useQueryClient()
  const { showToast } = useApp()

  return useMutation({
    mutationFn: (responseId) => markBestAnswerQuery(responseId, issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.byIssue(issueId) })
      showToast('Best answer marked!', 'success')
    },
    onError: (err) => showToast(err.message, 'error'),
  })
}

export function useEditResponse(issueId) {
  const queryClient   = useQueryClient()
  const { showToast } = useApp()

  return useMutation({
    mutationFn: ({ responseId, body }) => updateResponseQuery(responseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.byIssue(issueId) })
      showToast('Response updated.', 'success')
    },
    onError: (err) => showToast(err.message || 'Failed to update response.', 'error'),
  })
}

export function useDeleteResponse(issueId) {
  const queryClient   = useQueryClient()
  const { showToast } = useApp()

  return useMutation({
    mutationFn: (responseId) => deleteResponseQuery(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.byIssue(issueId) })
      showToast('Response deleted.', 'success')
    },
    onError: (err) => showToast(err.message || 'Failed to delete response.', 'error'),
  })
}
