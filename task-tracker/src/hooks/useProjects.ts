import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'
import type { UserRole } from '@/types'
import { getPermissions } from '@/types'

export function useProjects(userRole?: UserRole) {
  const perms = userRole ? getPermissions(userRole) : getPermissions('viewer')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch projects error:', error)
        setProjects([])
      } else if (data) {
        // Filter soft-deleted on client side (in case is_deleted column exists)
        const filtered = data.filter((p: Record<string, unknown>) => !p.is_deleted)
        setProjects(filtered as Project[])
      }
    } catch (err) {
      console.error('Fetch projects exception:', err)
      setProjects([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  async function createProject(name: string, shortName: string) {
    if (!perms.canCreateProject) return { data: null, error: 'You do not have permission to create projects' }
    try {
      const insertData: Record<string, unknown> = { name }
      if (shortName) insertData.short_name = shortName.toUpperCase()

      const { data, error } = await supabase.from('projects').insert(insertData).select().single()
      if (error) {
        console.error('Create project error:', error)
        return { data: null, error: error.message }
      }
      if (data) setProjects((prev) => [data as Project, ...prev])
      return { data: data as Project | null, error: undefined }
    } catch (err) {
      console.error('Create project exception:', err)
      return { data: null, error: 'Failed to create project' }
    }
  }

  async function deleteProject(id: string) {
    if (!perms.canDeleteProject) return { error: 'You do not have permission to delete projects' }
    try {
      // Try soft delete first
      const { error } = await supabase.from('projects').update({ is_deleted: true }).eq('id', id)
      if (!error) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
        return { error: undefined }
      }

      // If soft delete fails (column doesn't exist), do hard delete
      console.warn('Soft delete failed, trying hard delete:', error.message)
      const { error: delError } = await supabase.from('projects').delete().eq('id', id)
      if (delError) {
        console.error('Hard delete error:', delError)
        return { error: delError.message }
      }

      setProjects((prev) => prev.filter((p) => p.id !== id))
      return { error: undefined }
    } catch (err) {
      console.error('Delete project exception:', err)
      return { error: 'Failed to delete project' }
    }
  }

  return { projects, loading, createProject, deleteProject, refetch: fetchProjects }
}
