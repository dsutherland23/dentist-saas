import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import {
  canTransition,
  STATE_TIMESTAMP_KEYS,
  type VisitState,
} from "@/lib/visit-state-machine"

interface TransitionBody {
  appointmentId: string
  nextState: string
  flags?: Record<string, boolean>
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userWithRole = await supabase
      .from("users")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    if (!userWithRole.data?.clinic_id) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 })
    }

    const clinicId = userWithRole.data.clinic_id
    const userRole = userWithRole.data.role ?? null

    const body = (await request.json().catch(() => ({}))) as TransitionBody
    const { appointmentId, nextState, flags: bodyFlags } = body

    if (!appointmentId || !nextState) {
      return NextResponse.json(
        { error: "appointmentId and nextState required" },
        { status: 400 }
      )
    }

    // Load appointment
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select("id, clinic_id, patient_id, room, dentist_id, status")
      .eq("id", appointmentId)
      .eq("clinic_id", clinicId)
      .single()

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Load existing visit (if any)
    let { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId)
      .maybeSingle()

    if (visitError) {
      console.error("[VISITS_TRANSITION] fetch visit", visitError)
      return NextResponse.json({ error: "Failed to load visit" }, { status: 500 })
    }

    const now = new Date().toISOString()

    // No visit yet: only allow ARRIVED to create the visit
    if (!visit) {
      if (nextState !== "ARRIVED") {
        return NextResponse.json(
          { error: "Start visit by marking Arrived first" },
          { status: 400 }
        )
      }

      const newTimestamps: Record<string, string> = {
        arrived: now,
      }
      const newFlags = bodyFlags ?? {}

      const { data: inserted, error: insertError } = await supabase
        .from("visits")
        .insert({
          appointment_id: appointmentId,
          clinic_id: clinicId,
          status: "ARRIVED",
          timestamps: newTimestamps,
          flags: newFlags,
          room: appointment.room ?? null,
          dentist_id: appointment.dentist_id ?? null,
          assistant_id: null,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[VISITS_TRANSITION] insert visit", insertError)
        return NextResponse.json({ error: "Failed to create visit" }, { status: 500 })
      }

      return NextResponse.json({
        visit: {
          visitId: inserted.id,
          appointmentId: inserted.appointment_id,
          clinicId: inserted.clinic_id,
          status: inserted.status,
          timestamps: inserted.timestamps ?? {},
          flags: inserted.flags ?? {},
          room: inserted.room ?? null,
          dentistId: inserted.dentist_id ?? null,
          assistantId: inserted.assistant_id ?? null,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        },
        appointment: null,
      })
    }

    // Merge incoming flags before validation
    let mergedFlags = { ...(visit.flags ?? {}), ...(bodyFlags ?? {}) }

    const { data: clinicRow } = await supabase
      .from("clinics")
      .select("require_consent_in_visit_flow")
      .eq("id", clinicId)
      .single()

    if (clinicRow?.require_consent_in_visit_flow === false) {
      mergedFlags = { ...mergedFlags, consentSigned: true }
    }

    const result = canTransition(
      visit.status,
      nextState,
      { flags: mergedFlags },
      userRole
    )

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason ?? "Transition not allowed" },
        { status: 400 }
      )
    }

    const stateKey = STATE_TIMESTAMP_KEYS[nextState as VisitState]
    const updatedTimestamps = {
      ...(visit.timestamps ?? {}),
      ...(stateKey ? { [stateKey]: now } : {}),
    }

    const { data: updated, error: updateError } = await supabase
      .from("visits")
      .update({
        status: nextState,
        timestamps: updatedTimestamps,
        flags: mergedFlags,
        updated_at: now,
      })
      .eq("id", visit.id)
      .eq("clinic_id", clinicId)
      .select()
      .single()

    if (updateError) {
      console.error("[VISITS_TRANSITION] update visit", updateError)
      return NextResponse.json({ error: "Failed to update visit" }, { status: 500 })
    }

    let appointmentUpdate: { status?: string; checked_out_at?: string } | null = null

    if (nextState === "COMPLETED" || nextState === "CANCELLED") {
      const apptStatus = nextState === "COMPLETED" ? "completed" : "cancelled"
      const { error: apptUpdateError } = await supabase
        .from("appointments")
        .update({
          status: apptStatus,
          ...(nextState === "COMPLETED" ? { checked_out_at: now } : {}),
        })
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId)

      if (!apptUpdateError) {
        appointmentUpdate = {
          status: apptStatus,
          ...(nextState === "COMPLETED" ? { checked_out_at: now } : {}),
        }
      }
    }

    return NextResponse.json({
      visit: {
        visitId: updated.id,
        appointmentId: updated.appointment_id,
        clinicId: updated.clinic_id,
        status: updated.status,
        timestamps: updated.timestamps ?? {},
        flags: updated.flags ?? {},
        room: updated.room ?? null,
        dentistId: updated.dentist_id ?? null,
        assistantId: updated.assistant_id ?? null,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
      appointment: appointmentUpdate,
    })
  } catch (err) {
    console.error("[VISITS_TRANSITION]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
