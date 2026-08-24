import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // If profile doesn't exist, create one
      if (!data) {
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          const email = user.data.user.email || ''

          // Check for pending invitation
          const { data: invitation } = await supabase
            .from('invitations')
            .select('role')
            .eq('email', email)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single()

          // Check if any profiles exist - first user becomes super_admin
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

          const isFirstUser = !count || count === 0

          // Only invited users or first user get active automatically
          const hasInvitation = !!invitation || isFirstUser
          const userRole = isFirstUser ? 'super_admin' : (invitation?.role || 'viewer')

          // Mark invitation as accepted
          if (invitation) {
            await supabase.from('invitations').update({ status: 'accepted' }).eq('email', email)
          }

          const newProfile = {
            id: userId,
            name: user.data.user.user_metadata?.full_name || email.split('@')[0] || 'User',
            email,
            role: userRole as 'super_admin' | 'admin' | 'user' | 'viewer',
            avatar_url: user.data.user.user_metadata?.avatar_url || null,
            is_active: hasInvitation,
          }
          await supabase.from('profiles').insert(newProfile)
          setProfile(newProfile)
        }
      } else {
        const profile = data as Profile
        // Block inactive users (not approved by admin yet)
        if (profile.is_active === false) {
          setProfile(profile)
          setLoading(false)
          return
        }
        setProfile(profile)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { error: error?.message }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error: error?.message }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
