import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Epic } from '@/types'
import type { UserRole } from '@/types'

export function useEpics(projectId: string | null, userRole?: UserRole) {
  const [epics, setEpics] = useState<Epic[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEpics = useCallback(async () => {
    if (!projectId) {
      setEpics([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('epics')
        .select('*')
        .eq('project_id', projectId)

      if (error) {
        console.error('Fetch epics error:', error)
        setEpics([])
      } else if (data) {
        setEpics(data as Epic[])
      }
    } catch {
      setEpics([])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchEpics()
  }, [fetchEpics])

  async function createEpic(name: string, color: string) {
    if (userRole === 'viewer') return { data: null, error: 'Viewers cannot create epics' }
    try {
      const { data, error } = await supabase
        .from('epics')
        .insert({ project_id: projectId, name, color })
        .select()
        .single()

      if (error) {
        console.error('Create epic error:', error)
        return { data: null, error: error.message }
      }
      if (data) setEpics((prev) => [...prev, data as Epic])
      return { data: data as Epic | null, error: undefined }
    } catch (err) {
      console.error('Create epic exception:', err)
      return { data: null, error: 'Failed to create epic' }
    }
  }

  async function updateEpic(id: string, updates: Partial<Epic>) {
    try {
      const { data, error } = await supabase
        .from('epics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update epic error:', error)
        return { data: null, error: error.message }
      }
      if (data) setEpics((prev) => prev.map((e) => (e.id === id ? (data as Epic) : e)))
      return { data: data as Epic | null, error: undefined }
    } catch (err) {
      console.error('Update epic exception:', err)
      return { data: null, error: 'Failed to update epic' }
    }
  }

  async function deleteEpic(id: string) {
    if (userRole !== 'admin') return { error: 'Only admins can delete epics' }
    try {
      const { error } = await supabase.from('epics').delete().eq('id', id)
      if (error) {
        console.error('Delete epic error:', error)
        return { error: error.message }
      }
      setEpics((prev) => prev.filter((e) => e.id !== id))
      return { error: undefined }
    } catch (err) {
      console.error('Delete epic exception:', err)
      return { error: 'Failed to delete epic' }
    }
  }

  return { epics, loading, createEpic, updateEpic, deleteEpic, refetch: fetchEpics }
}
