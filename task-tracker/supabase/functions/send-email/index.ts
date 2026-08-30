import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@gantchart.app"
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "Gantt Chart"
const SITE_URL = Deno.env.get("SITE_URL") || "https://gant-chart-pi.vercel.app/"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailPayload {
  type: "invitation" | "task_assigned" | "mention"
  to_email: string
  to_name?: string
  subject: string
  invite_token?: string
  inviter_name?: string
  role?: string
  task_id?: string
  task_title?: string
  ticket_number?: number
  project_prefix?: string
  assigner_name?: string
  comment_body?: string
  commenter_name?: string
  task_context?: string
}

function buildInvitationHtml(toName: string, inviterName: string, role: string, inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Gantt Chart</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">Team Invitation</div>
        </td></tr>
        <tr><td style="padding:32px">
          <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:8px">Hi ${toName || 'there'},</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px">
            <strong>${inviterName}</strong> has invited you to join <strong>Gantt Chart</strong> as a <strong>${role}</strong>.
            You'll be able to manage tasks, collaborate with your team, and track project progress.
          </div>
          <a href="${inviteLink}" style="display:inline-block;background:#6366f1;color:#ffffff;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">Accept Invitation</a>
          <div style="margin-top:24px;font-size:12px;color:#9ca3af">
            If the button doesn't work, copy this link:<br>
            <a href="${inviteLink}" style="color:#6366f1;word-break:break-all">${inviteLink}</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
          <div style="font-size:11px;color:#9ca3af">This invitation was sent to ${toName || 'you'}. If you didn't expect this, you can safely ignore it.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildTaskAssignedHtml(toName: string, taskTitle: string, ticketId: string, assignerName: string, taskLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Gantt Chart</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">Task Assigned</div>
        </td></tr>
        <tr><td style="padding:32px">
          <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:8px">Hi ${toName || 'there'},</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:20px">
            <strong>${assignerName}</strong> assigned you a task:
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px">
            <div style="font-size:12px;color:#6366f1;font-weight:600;margin-bottom:4px">${ticketId}</div>
            <div style="font-size:15px;font-weight:600;color:#111827">${taskTitle}</div>
          </div>
          <a href="${taskLink}" style="display:inline-block;background:#6366f1;color:#ffffff;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">View Task</a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
          <div style="font-size:11px;color:#9ca3af">You received this because you were assigned to this task.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildMentionHtml(toName: string, commenterName: string, commentBody: string, taskTitle: string, taskLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Gantt Chart</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">You were mentioned</div>
        </td></tr>
        <tr><td style="padding:32px">
          <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:8px">Hi ${toName || 'there'},</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:12px">
            <strong>${commenterName}</strong> mentioned you in a comment on <strong>${taskTitle}</strong>:
          </div>
          <div style="background:#f0f0ff;border-left:4px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px">
            <div style="font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap">${commentBody}</div>
          </div>
          <a href="${taskLink}" style="display:inline-block;background:#6366f1;color:#ffffff;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">View Comment</a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
          <div style="font-size:11px;color:#9ca3af">You received this because someone mentioned you in a comment.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendBrevoEmail(to: string, toName: string, subject: string, htmlContent: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo API error ${res.status}: ${err}`)
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const payload: EmailPayload = await req.json()
    const { type, to_email, to_name } = payload

    if (!type || !to_email) {
      return new Response(JSON.stringify({ error: "Missing type or to_email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let subject = ""
    let htmlContent = ""

    if (type === "invitation") {
      const inviteLink = `${SITE_URL}?invite=${payload.invite_token}`
      subject = `${payload.inviter_name || "Someone"} invited you to join Gantt Chart`
      htmlContent = buildInvitationHtml(to_name || "", payload.inviter_name || "A team member", payload.role || "User", inviteLink)
    }
    else if (type === "task_assigned") {
      const ticketId = `${payload.project_prefix || "TASK"}-${payload.ticket_number || "???"}`
      const taskLink = `${SITE_URL}`
      subject = `You've been assigned ${ticketId}: ${payload.task_title}`
      htmlContent = buildTaskAssignedHtml(to_name || "", payload.task_title || "Untitled", ticketId, payload.assigner_name || "Someone", taskLink)
    }
    else if (type === "mention") {
      const taskLink = `${SITE_URL}`
      subject = `${payload.commenter_name || "Someone"} mentioned you in ${payload.task_context || "a task"}`
      htmlContent = buildMentionHtml(to_name || "", payload.commenter_name || "Someone", payload.comment_body || "", payload.task_context || "a task", taskLink)
    }

    await sendBrevoEmail(to_email, to_name || "", subject, htmlContent)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Email error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
