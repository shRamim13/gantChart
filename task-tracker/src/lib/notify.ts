import { supabase } from '@/lib/supabase'

export async function notifyTaskAssigned(taskId: string, assigneeId: string, assignerName?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Fetch assignee details
    const { data: assignee } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', assigneeId)
      .single()

    if (!assignee?.email) return

    // Fetch task details
    const { data: task } = await supabase
      .from('tasks')
      .select('title, ticket_number, project_id')
      .eq('id', taskId)
      .single()

    if (!task) return

    // Fetch project prefix
    let projectPrefix = 'TASK'
    if (task.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('short_name')
        .eq('id', task.project_id)
        .single()
      if (project?.short_name) projectPrefix = project.short_name
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'task_assigned',
        to_email: assignee.email,
        to_name: assignee.name || '',
        task_id: taskId,
        task_title: task.title,
        ticket_number: task.ticket_number,
        project_prefix: projectPrefix,
        assigner_name: assignerName || 'Someone',
      }),
    })
  } catch (err) {
    console.error('[Email] Task assigned notification failed:', err)
  }
}
