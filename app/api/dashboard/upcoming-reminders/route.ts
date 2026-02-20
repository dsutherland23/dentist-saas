import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { format } from "date-fns"

/**
 * GET /api/dashboard/upcoming-reminders
 * 
 * Returns appointments in the next 7 days for staff to send reminders.
 * Includes patient contact info and appointment details.
 */
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
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const sevenDaysFromNow = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

        // Fetch clinic name and phone for message template
        const { data: clinic } = await supabase
            .from("clinics")
            .select("name, phone")
            .eq("id", userData.clinic_id)
            .single()

        // Fetch appointments in next 7 days (today through +7 days)
        const { data: appointments, error } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                treatment_type,
                status,
                dentist_id,
                patients (first_name, last_name, phone),
                dentist:users!dentist_id (first_name, last_name)
            `)
            .eq("clinic_id", userData.clinic_id)
            .gte("start_time", todayStart.toISOString())
            .lte("start_time", sevenDaysFromNow.toISOString())
            .in("status", ["scheduled", "confirmed", "pending", "unconfirmed"])
            .order("start_time", { ascending: true })

        if (error) {
            console.error("Upcoming reminders fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
        }

        const today = new Date(todayStart)
        const twoDaysFromNow = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000)

        const reminders = (appointments || []).map((apt: any) => {
            const startTime = new Date(apt.start_time)
            const hours = startTime.getHours()
            const minutes = startTime.getMinutes()
            const ampm = hours >= 12 ? "PM" : "AM"
            const displayHours = hours % 12 || 12
            const displayMinutes = minutes.toString().padStart(2, "0")
            const timeStr = `${displayHours}:${displayMinutes} ${ampm}`
            
            const dateStr = format(startTime, "MMMM d, yyyy")
            const patientName = apt.patients
                ? `${apt.patients.first_name} ${apt.patients.last_name}`
                : "Unknown Patient"
            const dentistName = apt.dentist
                ? `Dr. ${apt.dentist.first_name} ${apt.dentist.last_name}`
                : "your dentist"
            
            // Categorize by date
            const appointmentDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate())
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const twoDaysDate = new Date(twoDaysFromNow.getFullYear(), twoDaysFromNow.getMonth(), twoDaysFromNow.getDate())
            
            let dateCategory: "today" | "in_2_days" | "in_7_days"
            if (appointmentDate.getTime() === todayDate.getTime()) {
                dateCategory = "today"
            } else if (appointmentDate.getTime() <= twoDaysDate.getTime()) {
                dateCategory = "in_2_days"
            } else {
                dateCategory = "in_7_days"
            }

            return {
                id: apt.id,
                patient: patientName,
                patientPhone: apt.patients?.phone || null,
                date: dateStr,
                time: timeStr,
                treatment: apt.treatment_type || "General Appointment",
                dentist: dentistName,
                dateCategory,
                startTime: apt.start_time,
            }
        })

        return NextResponse.json({
            reminders,
            clinic: {
                name: clinic?.name || "Your Clinic",
                phone: clinic?.phone || null,
            },
        })
    } catch (error) {
        console.error("Upcoming reminders error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
