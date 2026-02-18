import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 })
    }

    // Allow front desk + all clinical staff to create walk-ins
    const allowedRoles = [
      "receptionist",
      "accountant",
      "clinic_admin",
      "super_admin",
      "dentist",
      "hygienist",
    ]

    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      patient_id,
      dentist_id,
      treatment_type,
      room,
      duration_minutes = 30,
      notes,
    } = body

    if (!patient_id) {
      return NextResponse.json({ error: "patient_id is required" }, { status: 400 })
    }

    const now = new Date()
    const end = new Date(now.getTime() + duration_minutes * 60_000)

    // Simple queue number: increment based on existing walk-ins today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

    const { data: existingWalkIns } = await supabase
      .from("appointments")
      .select("queue_number, start_time")
      .eq("clinic_id", userData.clinic_id)
      .eq("is_walk_in", true)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .order("queue_number", { ascending: false })
      .limit(1)

    const nextQueue =
      existingWalkIns && existingWalkIns.length > 0 && existingWalkIns[0].queue_number
        ? existingWalkIns[0].queue_number + 1
        : 1

    const { data: appt, error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: userData.clinic_id,
        patient_id,
        dentist_id: dentist_id || null,
        treatment_type: treatment_type || "Walk-in",
        start_time: now.toISOString(),
        end_time: end.toISOString(),
        room: room || null,
        status: "checked_in",
        notes: notes || null,
        is_walk_in: true,
        queue_number: nextQueue,
      })
      .select("*")
      .single()

    if (error) {
      console.error("[WALK_IN_CREATE]", error)
      return NextResponse.json({ error: error.message || "Failed to create walk-in" }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointment: appt }, { status: 201 })
  } catch (e: any) {
    console.error("[WALK_IN_CREATE_FATAL]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

