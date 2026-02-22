import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { validateCustomWorkflowConfigWithZod } from "@/lib/workflow-spec"
import { STAGE_LIBRARY, type WorkflowTemplateConfig } from "@/lib/workflow-templates"

function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return supabase
    .from("users")
    .select("clinic_id, role")
    .eq("id", userId)
    .single()
    .then(({ data }) => {
      if (!data?.clinic_id) return { ok: false as const, status: 404, error: "No clinic found" }
      if (data.role !== "clinic_admin" && data.role !== "super_admin") {
        return { ok: false as const, status: 403, error: "Insufficient permissions" }
      }
      return { ok: true as const, clinicId: data.clinic_id }
    })
}

/** GET: list workflow templates for clinic, active_workflow_id, and stage library for builder */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auth = await requireAdmin(supabase, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: clinic } = await supabase
      .from("clinics")
      .select("active_workflow_id, workflow_template")
      .eq("id", auth.clinicId)
      .single()

    const { data: templates } = await supabase
      .from("workflow_templates")
      .select("id, name, config, created_at, updated_at")
      .eq("clinic_id", auth.clinicId)
      .order("updated_at", { ascending: false })

    return NextResponse.json({
      templates: templates ?? [],
      activeWorkflowId: clinic?.active_workflow_id ?? null,
      presetTemplate: clinic?.workflow_template ?? "full_clinic_workflow",
      stageLibrary: STAGE_LIBRARY,
    })
  } catch (err) {
    console.error("[workflow GET]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** POST: create workflow template and set as active */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auth = await requireAdmin(supabase, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json().catch(() => ({}))
    const { name = "Custom flow", config } = body as { name?: string; config?: WorkflowTemplateConfig }

    const validation = validateCustomWorkflowConfigWithZod(config)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: template, error: insertError } = await supabase
      .from("workflow_templates")
      .insert({
        clinic_id: auth.clinicId,
        name: String(name).slice(0, 255) || "Custom flow",
        config: validation.data as WorkflowTemplateConfig,
        updated_at: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[workflow POST]", insertError)
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }

    await supabase
      .from("clinics")
      .update({ active_workflow_id: template.id, updated_at: now })
      .eq("id", auth.clinicId)

    return NextResponse.json({ template, activeWorkflowId: template.id })
  } catch (err) {
    console.error("[workflow POST]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
