import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { validateCustomWorkflowConfigWithZod } from "@/lib/workflow-spec"
import type { WorkflowTemplateConfig } from "@/lib/workflow-templates"

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

/** GET: single workflow template by id (clinic-scoped) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auth = await requireAdmin(supabase, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const { data: template, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .single()

    if (error || !template) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json(template)
  } catch (err) {
    console.error("[workflow GET id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** PUT: update workflow template name and/or config */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auth = await requireAdmin(supabase, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const { data: existing } = await supabase
      .from("workflow_templates")
      .select("id")
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .single()

    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const { name, config } = body as { name?: string; config?: WorkflowTemplateConfig }

    const updatePayload: { name?: string; config?: WorkflowTemplateConfig; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }
    if (typeof name === "string") updatePayload.name = name.slice(0, 255) || "Custom flow"
    if (config !== undefined) {
      const validation = validateCustomWorkflowConfigWithZod(config)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      updatePayload.config = validation.data as WorkflowTemplateConfig
    }

    const { data: template, error: updateError } = await supabase
      .from("workflow_templates")
      .update(updatePayload)
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .select()
      .single()

    if (updateError) {
      console.error("[workflow PUT]", updateError)
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
    }
    return NextResponse.json(template)
  } catch (err) {
    console.error("[workflow PUT id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** DELETE: delete workflow template; if active, clear clinic active_workflow_id */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const auth = await requireAdmin(supabase, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await params
    const { data: existing } = await supabase
      .from("workflow_templates")
      .select("id")
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)
      .single()

    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const { data: clinic } = await supabase
      .from("clinics")
      .select("active_workflow_id")
      .eq("id", auth.clinicId)
      .single()

    const { error: deleteError } = await supabase
      .from("workflow_templates")
      .delete()
      .eq("id", id)
      .eq("clinic_id", auth.clinicId)

    if (deleteError) {
      console.error("[workflow DELETE]", deleteError)
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
    }

    if (clinic?.active_workflow_id === id) {
      await supabase
        .from("clinics")
        .update({ active_workflow_id: null, updated_at: new Date().toISOString() })
        .eq("id", auth.clinicId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[workflow DELETE id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
