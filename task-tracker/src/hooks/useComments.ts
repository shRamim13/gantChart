import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/types'

export function useComments(taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (!error && data) setComments(data as Comment[])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function addComment(body: string, userId: string): Promise<{ error?: string }> {
    if (!taskId || !body.trim()) return { error: 'Missing data' }
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, body: body.trim() })
      .select()
      .single()
    if (error) return { error: error.message }
    if (data) setComments((prev) => [...prev, data as Comment])
    return {}
  }

  async function deleteComment(id: string): Promise<{ error?: string }> {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) return { error: error.message }
    setComments((prev) => prev.filter((c) => c.id !== id))
    return {}
  }

  return { comments, loading, addComment, deleteComment, refetch: fetchComments }
}
