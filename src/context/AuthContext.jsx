import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Inline profile fetch with full error visibility (no import from queries.js
// so we can handle the PGRST116 "no rows" case differently from a real error)
async function fetchProfileDirect(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()          // returns null instead of throwing when no row found
  if (error) throw error
  return data               // null if no profile row yet
}

// Upsert a minimal profile row if none exists (handles Google OAuth new users
// whose profile trigger may not have fired yet).
//
// Race: a Postgres trigger may have inserted the row in the gap between our
// existence check and our insert. That race surfaces as Postgres error code
// 23505 (unique_violation). We catch THAT specific code and refetch; any
// other error is a real failure and propagates.
async function ensureProfile(user) {
  const existing = await fetchProfileDirect(user.id)
  if (existing) return existing

  // Profile row doesn't exist — create it manually
  const meta      = user.user_metadata ?? {}
  const email     = user.email ?? ''
  const baseName  = (meta.full_name ?? meta.name ?? email.split('@')[0] ?? 'user')
  const baseSlug  = baseName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)
  const username  = `${baseSlug}_${Math.floor(Math.random() * 9000 + 1000)}`

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id:        user.id,
      username,
      full_name: baseName,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    })
    .select()
    .single()

  if (error) {
    // 23505 = unique_violation — trigger raced ahead and created the row.
    // Refetch and return that row. We do NOT catch other codes (network,
    // RLS denial, validation) because those need to surface as real errors.
    if (error.code === '23505') {
      const retry = await fetchProfileDirect(user.id)
      if (retry) return retry
      // Row supposedly exists (unique violation) but we can't read it back.
      // Likely an RLS policy mismatch — surface clearly.
      throw new Error('Profile row exists but is not readable (check RLS).')
    }
    throw error
  }
  return data
}

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(undefined) // undefined = still loading
  const [currentUser, setCurrentUser] = useState(null)

  const loadProfile = useCallback(async (user) => {
    try {
      const profile = await ensureProfile(user)
      setCurrentUser(profile)
    } catch (err) {
      console.error('loadProfile failed:', err.message)
      // Set a minimal user object from auth metadata so UI never hangs
      const meta = user.user_metadata ?? {}
      setCurrentUser({
        id:          user.id,
        full_name:   meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'User',
        username:    user.email?.split('@')[0] ?? 'user',
        avatar_url:  meta.avatar_url ?? meta.picture ?? null,
        role:        'member',
        trust_score: 0,
        state:       null,
        batch:       null,
      })
    }
  }, [])

  useEffect(() => {
    // Resolve initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
      if (session?.user) loadProfile(session.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session ?? null)
        if (session?.user) {
          await loadProfile(session.user)
        } else {
          setCurrentUser(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signup = useCallback(async ({ email, password, fullName, state, batch }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, state, batch } },
    })
    if (error) throw error
    return data
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Land on /auth/callback (a real route that waits for the session
      // to resolve and routes the user appropriately) rather than going
      // straight to /dashboard, where a transient failure would leave the
      // user on a protected page with no session.
      options:  { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
    return data
  }, [])

  const loginWithMagicLink = useCallback(async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
    return data
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadProfile(session.user)
  }, [loadProfile])

  return (
    <AuthContext.Provider value={{
      session,
      currentUser,
      isLoading: session === undefined,
      login,
      signup,
      loginWithGoogle,
      loginWithMagicLink,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
