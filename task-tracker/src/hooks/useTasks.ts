import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import type { UserRole } from '@/types'

export function useTasks(projectId: string | null, userRole?: UserRole) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch tasks error:', error)
        setTasks([])
      } else if (data) {
        // Filter soft-deleted on client side
        const filtered = data.filter((t: Record<string, unknown>) => !t.is_deleted)
        setTasks(filtered as Task[])
      }
    } catch (err) {
      console.error('Fetch tasks exception:', err)
      setTasks([])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel('tasks-changes-' + projectId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task
          if (!newTask.is_deleted && newTask.project_id === projectId) {
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev
              return [...prev, newTask]
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Task
          if (updated.is_deleted) {
            setTasks((prev) => prev.filter((t) => t.id !== updated.id))
          } else if (updated.project_id === projectId) {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'ticket_number'>) {
    if (userRole === 'viewer') return { data: null, error: 'Viewers cannot create tasks' }
    try {
      let ticketNumber = 1
      try {
        const { data: maxTicket } = await supabase
          .from('tasks')
          .select('ticket_number')
          .eq('project_id', task.project_id)
          .order('ticket_number', { ascending: false })
          .limit(1)
          .single()

        if (maxTicket && (maxTicket as Record<string, unknown>).ticket_number) {
          ticketNumber = ((maxTicket as Record<string, unknown>).ticket_number as number) + 1
        }
      } catch {
        // ticket_number column might not exist
      }

      const insertData: Record<string, unknown> = {
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        est_hours: task.est_hours,
        est_days: task.est_days,
        start_date: task.start_date,
        due_date: task.due_date,
        epic_id: task.epic_id,
        module_id: task.module_id,
        assignee_id: task.assignee_id,
        parent_task_id: task.parent_task_id || null,
        task_type: task.task_type || 'feature',
        ticket_number: ticketNumber,
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Create task error:', error)
        return { data: null, error: error.message }
      }

      if (data) {
        setTasks((prev) => [...prev, data as Task])
      }
      return { data: data as Task | null, error: undefined }
    } catch (err) {
      console.error('Create task exception:', err)
      return { data: null, error: 'Failed to create task' }
    }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    if (userRole === 'viewer') return { data: null, error: 'Viewers cannot update tasks' }
    try {
      const safeUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) safeUpdates.title = updates.title
      if (updates.description !== undefined) safeUpdates.description = updates.description
      if (updates.status !== undefined) safeUpdates.status = updates.status
      if (updates.priority !== undefined) safeUpdates.priority = updates.priority
      if (updates.task_type !== undefined) safeUpdates.task_type = updates.task_type
      if (updates.est_hours !== undefined) safeUpdates.est_hours = updates.est_hours
      if (updates.est_days !== undefined) safeUpdates.est_days = updates.est_days
      if (updates.start_date !== undefined) safeUpdates.start_date = updates.start_date
      if (updates.due_date !== undefined) safeUpdates.due_date = updates.due_date
      if (updates.assignee_id !== undefined) safeUpdates.assignee_id = updates.assignee_id
      if (updates.epic_id !== undefined) safeUpdates.epic_id = updates.epic_id
      if (updates.module_id !== undefined) safeUpdates.module_id = updates.module_id

      const { data, error } = await supabase
        .from('tasks')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update task error:', error)
        return { data: null, error: error.message }
      }
      if (data) setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
      return { data: data as Task | null, error: undefined }
    } catch (err) {
      console.error('Update task exception:', err)
      return { data: null, error: 'Failed to update task' }
    }
  }

  async function deleteTask(id: string) {
    if (userRole === 'viewer') return { error: 'Viewers cannot delete tasks' }
    try {
      // Try soft delete first
      const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', id)
      if (!error) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        return { error: undefined }
      }

      // If soft delete fails, do hard delete
      console.warn('Soft delete failed, trying hard delete:', error.message)
      const { error: delError } = await supabase.from('tasks').delete().eq('id', id)
      if (delError) {
        console.error('Hard delete error:', delError)
        return { error: delError.message }
      }

      setTasks((prev) => prev.filter((t) => t.id !== id))
      return { error: undefined }
    } catch (err) {
      console.error('Delete task exception:', err)
      return { error: 'Failed to delete task' }
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    return updateTask(id, { status })
  }

  async function updatePriority(id: string, priority: TaskPriority) {
    return updateTask(id, { priority })
  }

  const nextTicketNumber = tasks.length > 0 ? Math.max(0, ...tasks.map((t) => t.ticket_number || 0)) + 1 : 1

  return { tasks, loading, createTask, updateTask, deleteTask, updateStatus, updatePriority, refetch: fetchTasks, nextTicketNumber }
}
