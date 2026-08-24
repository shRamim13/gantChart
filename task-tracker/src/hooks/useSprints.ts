import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Sprint } from '@/types'

export function useSprints(projectId: string | null) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSprints = useCallback(async () => {
    if (!projectId) {
      setSprints([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Fetch sprints error:', error)
        setSprints([])
      } else if (data) {
        setSprints(data as Sprint[])
      }
    } catch {
      setSprints([])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchSprints()
  }, [fetchSprints])

  async function createSprint(sprint: Omit<Sprint, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert(sprint)
        .select()
        .single()

      if (error) {
        console.error('Create sprint error:', error)
        return { data: null, error: error.message }
      }
      if (data) setSprints((prev) => [data as Sprint, ...prev])
      return { data: data as Sprint | null, error: undefined }
    } catch (err) {
      console.error('Create sprint exception:', err)
      return { data: null, error: 'Failed to create sprint' }
    }
  }

  async function updateSprint(id: string, updates: Partial<Sprint>) {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update sprint error:', error)
        return { data: null, error: error.message }
      }
      if (data) setSprints((prev) => prev.map((s) => (s.id === id ? (data as Sprint) : s)))
      return { data: data as Sprint | null, error: undefined }
    } catch (err) {
      console.error('Update sprint exception:', err)
      return { data: null, error: 'Failed to update sprint' }
    }
  }

  async function deleteSprint(id: string) {
    try {
      const { error } = await supabase.from('sprints').delete().eq('id', id)
      if (error) {
        console.error('Delete sprint error:', error)
        return { error: error.message }
      }
      setSprints((prev) => prev.filter((s) => s.id !== id))
      return { error: undefined }
    } catch (err) {
      console.error('Delete sprint exception:', err)
      return { error: 'Failed to delete sprint' }
    }
  }

  async function assignTaskToSprint(taskId: string, sprintId: string | null) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ sprint_id: sprintId })
        .eq('id', taskId)

      if (error) {
        console.error('Assign task to sprint error:', error)
        return { error: error.message }
      }
      return { error: undefined }
    } catch (err) {
      console.error('Assign task to sprint exception:', err)
      return { error: 'Failed to assign task' }
    }
  }

  const activeSprint = sprints.find((s) => s.status === 'active')

  return { sprints, loading, activeSprint, createSprint, updateSprint, deleteSprint, assignTaskToSprint, refetch: fetchSprints }
}
