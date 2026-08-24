import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Attachment } from '@/types'

export function useAttachments(taskId: string | null) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    if (!error && data) setAttachments(data as Attachment[])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  async function uploadAttachment(file: File, userId: string): Promise<{ error?: string }> {
    if (!taskId) return { error: 'No task ID' }
    const filePath = `${taskId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file)
    if (uploadError) return { error: uploadError.message }
    const { error: dbError } = await supabase.from('task_attachments').insert({
      task_id: taskId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: filePath,
      uploaded_by: userId,
    })
    if (dbError) return { error: dbError.message }
    await fetchAttachments()
    return {}
  }

  async function deleteAttachment(attachment: Attachment): Promise<{ error?: string }> {
    await supabase.storage.from('task-attachments').remove([attachment.storage_path])
    const { error } = await supabase.from('task_attachments').delete().eq('id', attachment.id)
    if (error) return { error: error.message }
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    return {}
  }

  async function getSignedUrl(attachment: Attachment): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(attachment.storage_path, 3600)
    if (error) return null
    return data.signedUrl
  }

  return { attachments, loading, uploadAttachment, deleteAttachment, getSignedUrl }
}
