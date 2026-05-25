import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  const [profileLoading, setProfileLoading] = useState(false)
  const loadedUserId = useRef(null)

  const loadProfile = useCallback(async (user) => {
    setProfileLoading(true)
    try {
      const profile = await ensureProfile(user)
      console.debug('[auth] profile loaded:', profile?.username ?? profile?.id)
      setCurrentUser(profile)
    } catch (err) {
      // A common transient cause is the auth token being mid-refresh when the
      // request fires (e.g. when returning to an idle tab). Wait briefly for
      // the session to settle and retry once before giving up.
      console.warn('[auth] loadProfile failed, retrying once:', err.message)
      try {
        await new Promise((r) => setTimeout(r, 600))
        await supabase.auth.getSession() // nudges token refresh if needed
        const profile = await ensureProfile(user)
        setCurrentUser(profile)
        return
      } catch (retryErr) {
        console.error('[auth] loadProfile failed after retry:', retryErr.message)
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
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    // Single source of truth: onAuthStateChange fires an INITIAL_SESSION event
    // on mount (supabase-js v2) with the restored session, then SIGNED_IN /
    // TOKEN_REFRESHED / SIGNED_OUT as they happen.
    //
    // CRITICAL: the callback must NOT await any supabase database call directly.
    // onAuthStateChange holds an internal lock; awaiting a supabase.from(...)
    // query inside it deadlocks (the query waits for the lock, the lock waits
    // for the callback to return). This manifests as loadProfile never
    // resolving — no success and no error logged. So we keep the callback
    // synchronous and defer the profile load to a microtask via setTimeout(0),
    // which runs AFTER the callback returns and releases the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return
        console.debug('[auth] event:', event, 'user:', session?.user?.email ?? '(none)')
        setSession(session ?? null)

        if (!session?.user) {
          loadedUserId.current = null
          setCurrentUser(null)
          return
        }

        // TOKEN_REFRESHED fires when returning to an idle tab. If the same user
        // is already loaded, skip the reload to avoid flicker.
        if (event === 'TOKEN_REFRESHED' && loadedUserId.current === session.user.id) {
          return
        }

        loadedUserId.current = session.user.id
        // Mark profile as loading immediately (synchronously) so the UI shows a
        // spinner during the gap before the deferred load resolves, instead of
        // briefly flashing the "Profile unavailable" / fallback state.
        setProfileLoading(true)
        // Defer the actual DB call OUT of the auth callback to avoid the lock
        // deadlock (awaiting a supabase query inside this callback hangs).
        setTimeout(() => {
          if (active) loadProfile(session.user)
        }, 0)
      }
    )

    return () => { active = false; subscription.unsubscribe() }
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
      // isLoading is true while EITHER the session is still resolving, OR a
      // session exists but its profile hasn't finished loading yet. This keeps
      // protected pages on a spinner across the whole gap instead of briefly
      // flashing the fallback "User" / "Profile unavailable" state on refresh.
      isLoading: session === undefined || (!!session?.user && !currentUser && profileLoading),
      profileLoading,
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
