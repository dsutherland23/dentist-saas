import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/invoices/[id] – update invoice (e.g. link to appointment).
 * Body: { appointment_id?: string | null, status?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single()

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { appointment_id: appointmentId, status } = body

    const updates: Record<string, unknown> = {}
    if (appointmentId !== undefined) updates.appointment_id = appointmentId || null
    if (status !== undefined) updates.status = status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Provide appointment_id and/or status to update" },
        { status: 400 }
      )
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", userData.clinic_id)
      .select()
      .single()

    if (error) throw error
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[INVOICES_ID_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
