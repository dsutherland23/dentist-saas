import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
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

        const clinicId = userData.clinic_id

        // Get today's details (use separate Date instances to avoid mutating)
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        const dayOfWeek = now.getDay() // 0-6

        // Fetch today's appointments
        const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                end_time,
                treatment_type,
                status,
                patients (first_name, last_name)
            `)
            .eq("clinic_id", clinicId)
            .gte("start_time", todayStart.toISOString())
            .lte("start_time", todayEnd.toISOString())
            .order("start_time", { ascending: true })

        // Fetch today's staff rota from staff_schedules
        const { data: staffRota, error: rotaError } = await supabase
            .from("staff_schedules")
            .select(`
                id,
                start_time,
                end_time,
                users:staff_id (id, first_name, last_name, role)
            `)
            .eq("clinic_id", clinicId)
            .eq("day_of_week", dayOfWeek)
            .eq("is_active", true)

        if (apptError) {
            console.error("Error fetching appointments:", apptError)
            return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
        }

        // If rota fetch failed or no schedules, fall back to all active staff in clinic
        let rotaFromSchedules = staffRota || []
        if (rotaError) {
            console.warn("Rota fetch error (falling back to staff list):", rotaError)
        }
        if (rotaFromSchedules.length === 0) {
            // No schedules configured — show all clinic staff as "on duty"
            const { data: allStaff } = await supabase
                .from("users")
                .select("id, first_name, last_name, role")
                .eq("clinic_id", clinicId)
                .neq("role", "patient")
                .eq("is_active", true)
            rotaFromSchedules = (allStaff || []).map((u: any) => ({
                id: u.id,
                start_time: "09:00",
                end_time: "17:00",
                users: u,
            }))
        }

        // Format appointments
        const schedule = appointments?.map((appt: any) => {
            const startTime = new Date(appt.start_time)
            const hours = startTime.getHours()
            const minutes = startTime.getMinutes()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            const displayMinutes = minutes.toString().padStart(2, '0')

            return {
                id: appt.id,
                time: `${displayHours}:${displayMinutes} ${ampm}`,
                patient: appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown Patient",
                treatment: appt.treatment_type || "General Appointment",
                status: appt.status || "scheduled",
                type: 'appointment'
            }
        }) || []

        // Format staff rota
        const rota = rotaFromSchedules?.map((shift: any) => ({
            id: shift.id,
            staff_id: shift.users?.id || "",
            time: `${shift.start_time?.slice(0, 5)} - ${shift.end_time?.slice(0, 5)}`,
            staff: shift.users ? `${shift.users.first_name} ${shift.users.last_name}` : "Unknown Staff",
            role: shift.users?.role || "Staff",
            type: 'shift'
        })) || []

        return NextResponse.json({ schedule, rota })

    } catch (error) {
        console.error("Dashboard schedule error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
