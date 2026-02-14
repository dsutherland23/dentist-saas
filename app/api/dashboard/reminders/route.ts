import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET appointments starting in the next 2 hours (for reminder popup)
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

        const now = new Date()
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

        // Appointments starting in the next 2 hours, not yet completed
        const { data: appointments, error } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                treatment_type,
                status,
                patients (first_name, last_name, phone)
            `)
            .eq("clinic_id", userData.clinic_id)
            .gte("start_time", now.toISOString())
            .lte("start_time", twoHoursFromNow.toISOString())
            .in("status", ["scheduled", "confirmed", "checked_in", "in_treatment"])
            .order("start_time", { ascending: true })

        if (error) {
            console.error("Reminders fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
        }

        const reminders = (appointments || []).map((apt: any) => {
            const startTime = new Date(apt.start_time)
            const hours = startTime.getHours()
            const minutes = startTime.getMinutes()
            const ampm = hours >= 12 ? "PM" : "AM"
            const displayHours = hours % 12 || 12
            const displayMinutes = minutes.toString().padStart(2, "0")
            return {
                id: apt.id,
                time: `${displayHours}:${displayMinutes} ${ampm}`,
                patient: apt.patients
                    ? `${apt.patients.first_name} ${apt.patients.last_name}`
                    : "Unknown Patient",
                phone: apt.patients?.phone || null,
                treatment: apt.treatment_type || "General Appointment",
                status: apt.status,
            }
        })

        return NextResponse.json({ reminders })
    } catch (error) {
        console.error("Dashboard reminders error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
