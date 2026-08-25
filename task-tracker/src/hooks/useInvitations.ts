import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invitation, UserRole } from '@/types'

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch invitations error:', error)
        setInvitations([])
      } else if (data) {
        setInvitations(data as Invitation[])
      }
    } catch (err) {
      console.error('Fetch invitations exception:', err)
      setInvitations([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  async function inviteUser(email: string, role: UserRole) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'Not authenticated' }

      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingProfile) {
        return { error: 'User already has an account' }
      }

      // Check if already invited
      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingInvite) {
        return { error: 'User already has a pending invitation' }
      }

      // Store invitation in DB
      const { data, error } = await supabase
        .from('invitations')
        .insert({ email, role, invited_by: user.id, status: 'pending' })
        .select()
        .single()

      if (error) {
        console.error('Invite user error:', error)
        return { error: error.message }
      }

      // Send actual email via Supabase auth magic link
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (emailError) {
        console.warn('Email send failed (invitation still saved):', emailError.message)
        // Still return success — invitation is saved, admin can share link manually
        return { data: data as Invitation | null, error: undefined, emailFailed: true }
      }

      if (data) setInvitations((prev) => [data as Invitation, ...prev])
      return { data: data as Invitation | null, error: undefined }
    } catch (err) {
      console.error('Invite user exception:', err)
      return { error: 'Failed to invite user' }
    }
  }

  async function deleteInvitation(id: string) {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (error) return { error: error.message }
      setInvitations((prev) => prev.filter((i) => i.id !== id))
      return { error: undefined }
    } catch {
      return { error: 'Failed to delete invitation' }
    }
  }

  async function revokeInvitation(id: string) {
    try {
      const { error } = await supabase.from('invitations').update({ status: 'expired' }).eq('id', id)
      if (error) return { error: error.message }
      setInvitations((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'expired' as const } : i)))
      return { error: undefined }
    } catch {
      return { error: 'Failed to revoke invitation' }
    }
  }

  async function checkInvitation(email: string): Promise<{ role: UserRole | null }> {
    try {
      const { data } = await supabase
        .from('invitations')
        .select('role')
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (data) {
        await supabase.from('invitations').update({ status: 'accepted' }).eq('email', email)
        return { role: data.role as UserRole }
      }
      return { role: null }
    } catch {
      return { role: null }
    }
  }

  async function deleteUser(userId: string) {
    try {
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)
      if (profileError) return { error: profileError.message }
      setInvitations((prev) => prev)
      return { error: undefined }
    } catch {
      return { error: 'Failed to delete user' }
    }
  }

  return { invitations, loading, inviteUser, deleteInvitation, revokeInvitation, checkInvitation, deleteUser, refetch: fetchInvitations }
}
