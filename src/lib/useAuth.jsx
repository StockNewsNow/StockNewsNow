import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid || !supabase) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, email, is_pro')
      .eq('id', uid)
      .single()
    setProfile(data || null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id)
  }, [user, loadProfile])

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data?.session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
      setLoading(false)
    })

    return () => sub?.subscription?.unsubscribe()
  }, [loadProfile])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const value = {
    user,
    profile,
    loading,
    isPro: Boolean(profile?.is_pro),
    isConfigured,
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
