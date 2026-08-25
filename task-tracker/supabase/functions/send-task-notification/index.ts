import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { task_id, assignee_id, assigner_name } = await req.json()

    if (!task_id || !assignee_id) {
      return new Response(JSON.stringify({ error: "Missing task_id or assignee_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get assignee profile
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { data: assignee } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", assignee_id)
      .single()

    if (!assignee?.email) {
      return new Response(JSON.stringify({ error: "Assignee not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get task details
    const { data: task } = await supabase
      .from("tasks")
      .select("title, ticket_number, project_id")
      .eq("id", task_id)
      .single()

    // Get project prefix
    let prefix = "TASK"
    if (task?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("short_name")
        .eq("id", task.project_id)
        .single()
      if (project?.short_name) prefix = project.short_name
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping email")
      return new Response(JSON.stringify({ success: true, email_skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Task Tracker <onboarding@resend.dev>",
        to: [assignee.email],
        subject: `You've been assigned ${prefix}-${task?.ticket_number || "???"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f46e5;">New Task Assignment</h2>
            <p>Hi ${assignee.name},</p>
            <p><strong>${assigner_name || "Someone"}</strong> assigned you a task:</p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0; font-weight: 600; color: #111827;">${prefix}-${task?.ticket_number || "???"}: ${task?.title || "Untitled Task"}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Open your dashboard to view details and start working.</p>
            <a href="${Deno.env.get("SITE_URL") || "https://your-app.vercel.app"}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 12px;">View Task</a>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errText = await emailResponse.text()
      console.error("Resend error:", errText)
      return new Response(JSON.stringify({ error: "Email send failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
