import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProfile, updateProfileQuery, fetchTrustEvents, fetchTopAmbassadors } from '../lib/queries'
import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'

export function useProfile(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn:  () => fetchProfile(userId),
    enabled:  !!userId,
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const queryClient           = useQueryClient()
  const { currentUser, refreshProfile } = useAuth()
  const { showToast }         = useApp()

  return useMutation({
    mutationFn: (updates) => updateProfileQuery(currentUser.id, updates),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser.id] })
      await refreshProfile()
      showToast('Profile updated!', 'success')
    },
    onError: (err) => showToast(err.message, 'error'),
  })
}

export function useTrustEvents(userId) {
  return useQuery({
    queryKey: ['trust-events', userId],
    queryFn:  () => fetchTrustEvents(userId),
    enabled:  !!userId,
    staleTime: 30_000,
  })
}

export function useTopAmbassadors() {
  return useQuery({
    queryKey: ['ambassadors', 'top'],
    queryFn:  fetchTopAmbassadors,
    staleTime: 120_000,
  })
}
