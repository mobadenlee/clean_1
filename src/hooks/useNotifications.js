import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase }  from '../lib/supabase'
import { fetchNotifications, markNotifReadQuery, markAllNotifsReadQuery } from '../lib/queries'
import { useAuth } from '../context/AuthContext'

export const notifKeys = {
  all: (userId) => ['notifications', userId],
}

export function useNotifications() {
  const { currentUser } = useAuth()
  const userId          = currentUser?.id
  const queryClient     = useQueryClient()

  // Realtime: listen for new notifications.
  //
  // Strict-Mode double-mount fix: per-mount channel name so the first
  // cleanup doesn't kill the second mount's still-subscribing channel.
  // See useResponses.js for the same pattern.
  useEffect(() => {
    if (!userId) return
    const channelName = `notifications-${userId}-${
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    }`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `recipient_id=eq.${userId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all(userId) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])

  const query = useQuery({
    queryKey: notifKeys.all(userId),
    queryFn:  () => fetchNotifications(userId),
    enabled:  !!userId,
    staleTime: 0,
  })

  const unreadCount = (query.data ?? []).filter(n => !n.is_read).length

  return { ...query, unreadCount }
}

export function useMarkNotifRead() {
  const { currentUser } = useAuth()
  const queryClient     = useQueryClient()

  return useMutation({
    mutationFn: (notifId) => markNotifReadQuery(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all(currentUser?.id) })
    },
  })
}

export function useMarkAllNotifsRead() {
  const { currentUser } = useAuth()
  const queryClient     = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotifsReadQuery(currentUser?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all(currentUser?.id) })
    },
  })
}
