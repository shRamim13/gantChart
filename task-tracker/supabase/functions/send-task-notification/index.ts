import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const { data: assignee } = await supabase.from("profiles").select("name, email").eq("id", assignee_id).single()
    if (!assignee?.email) {
      return new Response(JSON.stringify({ error: "Assignee not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: task } = await supabase.from("tasks").select("title, ticket_number, project_id").eq("id", task_id).single()
    let prefix = "TASK"
    if (task?.project_id) {
      const { data: project } = await supabase.from("projects").select("short_name").eq("id", task.project_id).single()
      if (project?.short_name) prefix = project.short_name
    }

    // Use Supabase built-in email (magic link style)
    const SITE_URL = Deno.env.get("SITE_URL") || "https://gant-chart-pi.vercel.app/"
    const { error: otpError } = await supabase.auth.admin.inviteUserByEmail(assignee.email, {
      data: {
        task_subject: `You've been assigned ${prefix}-${task?.ticket_number || "???"}: ${task?.title || "Untitled"}`,
        assigner: assigner_name || "Someone",
      },
      redirectTo: SITE_URL,
    })

    if (otpError) {
      // Fallback: try signInWithOtp
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: assignee.email,
        options: {
          emailRedirectTo: SITE_URL,
          data: {
            task_subject: `${prefix}-${task?.ticket_number || "???"}: ${task?.title || "Untitled"}`,
            assigner: assigner_name || "Someone",
          },
        },
      })

      if (signInError) {
        console.error("Email send failed:", signInError.message)
        return new Response(JSON.stringify({ error: signInError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
