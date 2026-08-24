import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

export function useAdminProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

      if (error) {
        console.error('Fetch profiles error:', error)
        setProfiles([])
      } else if (data) {
        setProfiles(data as Profile[])
      }
    } catch (err) {
      console.error('Fetch profiles exception:', err)
      setProfiles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  async function updateRole(id: string, role: UserRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)

      if (error) {
        console.error('Update role error:', error)
        return { error: error.message }
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role } : p))
      )
      return { error: undefined }
    } catch (err) {
      console.error('Update role exception:', err)
      return { error: 'Failed to update role' }
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) {
        console.error('Toggle active error:', error)
        return { error: error.message }
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p))
      )
      return { error: undefined }
    } catch (err) {
      console.error('Toggle active exception:', err)
      return { error: 'Failed to update user status' }
    }
  }

  async function deleteUser(id: string) {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) return { error: error.message }
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      return { error: undefined }
    } catch {
      return { error: 'Failed to delete user' }
    }
  }

  return { profiles, loading, updateRole, toggleActive, deleteUser, refetch: fetchProfiles }
}
