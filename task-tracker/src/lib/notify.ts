import { supabase } from '@/lib/supabase'

export async function notifyTaskAssigned(taskId: string, assigneeId: string, assignerName?: string) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    console.log('[Notification] Sending assign notification...', { taskId, assigneeId })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('[Notification] No session — skipped')
      return
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/send-task-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_id: taskId, assignee_id: assigneeId, assigner_name: assignerName }),
    })

    const data = await res.json()
    console.log('[Notification] Response:', res.status, data)
  } catch (err) {
    console.error('[Notification] Failed:', err)
  }
}
