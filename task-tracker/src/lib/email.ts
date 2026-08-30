import { supabase } from '@/lib/supabase'

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`

async function callEdgeFunction(payload: Record<string, unknown>) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Email] Failed:', err)
  }
}

export async function sendInvitationEmail(
  toEmail: string,
  toName: string,
  inviteToken: string,
  inviterName: string,
  role: string
) {
  await callEdgeFunction({
    type: 'invitation',
    to_email: toEmail,
    to_name: toName,
    invite_token: inviteToken,
    inviter_name: inviterName,
    role,
  })
}

export async function sendTaskAssignedEmail(
  toEmail: string,
  toName: string,
  taskId: string,
  taskTitle: string,
  ticketNumber: number,
  projectPrefix: string,
  assignerName: string
) {
  await callEdgeFunction({
    type: 'task_assigned',
    to_email: toEmail,
    to_name: toName,
    task_id: taskId,
    task_title: taskTitle,
    ticket_number: ticketNumber,
    project_prefix: projectPrefix,
    assigner_name: assignerName,
  })
}

export async function sendMentionEmail(
  toEmail: string,
  toName: string,
  commenterName: string,
  commentBody: string,
  taskTitle: string
) {
  await callEdgeFunction({
    type: 'mention',
    to_email: toEmail,
    to_name: toName,
    commenter_name: commenterName,
    comment_body: commentBody,
    task_context: taskTitle,
  })
}
