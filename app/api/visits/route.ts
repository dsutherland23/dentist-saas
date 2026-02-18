import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * GET /api/visits?appointmentId=...
 * Returns the visit for the given appointment (if any). Used by calendar to show progress panel.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single()

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")
    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 })
    }

    const { data: visit, error } = await supabase
      .from("visits")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", userData.clinic_id)
      .maybeSingle()

    if (error) {
      console.error("[VISITS_GET]", error)
      return NextResponse.json({ visit: null })
    }

    if (!visit) {
      return NextResponse.json({ visit: null })
    }

    // Shape for UI: camelCase ids and consistent structure
    const response = {
      visit: {
        visitId: visit.id,
        appointmentId: visit.appointment_id,
        clinicId: visit.clinic_id,
        status: visit.status,
        timestamps: visit.timestamps ?? {},
        flags: visit.flags ?? {},
        room: visit.room ?? null,
        dentistId: visit.dentist_id ?? null,
        assistantId: visit.assistant_id ?? null,
        createdAt: visit.created_at,
        updatedAt: visit.updated_at,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error("[VISITS_GET]", err)
    return NextResponse.json({ visit: null })
  }
}
