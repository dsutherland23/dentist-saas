import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

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

        const { searchParams } = new URL(req.url)
        const dateParam = searchParams.get("date")
        const todayStr = new Date().toISOString().split("T")[0]
        const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr

        const clinicId = userData.clinic_id

        // Query the daily_chair_utilization view
        const { data: utilizationData, error: utilizationError } = await supabase
            .from("daily_chair_utilization")
            .select("*")
            .eq("clinic_id", clinicId)
            .eq("appointment_date", date)
            .order("operatory")

        if (utilizationError) {
            console.error("Error fetching utilization:", utilizationError)
        }

        // Get today's schedule summary
        const { data: summaryData, error: summaryError } = await supabase
            .from("todays_schedule_summary")
            .select("*")
            .eq("clinic_id", clinicId)
            .single()

        if (summaryError) {
            console.error("Error fetching summary:", summaryError)
        }

        // Get staff/dentist names
        const dentistIds = utilizationData?.map(u => u.dentist_id).filter(Boolean) || []
        let dentistNames: Record<string, string> = {}

        if (dentistIds.length > 0) {
            const { data: dentists } = await supabase
                .from("users")
                .select("id, first_name, last_name")
                .in("id", dentistIds)

            if (dentists) {
                dentistNames = dentists.reduce((acc, d) => {
                    acc[d.id] = `${d.first_name} ${d.last_name}`
                    return acc
                }, {} as Record<string, string>)
            }
        }

        // Enrich utilization data with dentist names and safe numeric fields
        const pct = (u: any) => Number(u?.utilization_percent) || 0
        const enrichedUtilization = utilizationData?.map(u => {
            const percent = pct(u)
            return {
                ...u,
                utilization_percent: percent,
                total_hours: Number(u?.total_hours) || 0,
                total_appointments: Number(u?.total_appointments) || 0,
                dentist_name: dentistNames[u.dentist_id] || "Unassigned",
                utilizationLevel:
                    percent >= 90 ? "excellent" : percent >= 70 ? "good" : "needs-improvement",
            }
        }) || []

        const opUse = Number(summaryData?.operatories_in_use) || 0
        const bHours = Number(summaryData?.booked_hours) || 0
        return NextResponse.json({
            utilizationByChair: enrichedUtilization,
            todaySummary: {
                totalAppointments: Number(summaryData?.total_appointments) || 0,
                bookedHours: bHours,
                completedCount: Number(summaryData?.completed_count) || 0,
                cancelledCount: Number(summaryData?.cancelled_count) || 0,
                noShowCount: Number(summaryData?.no_show_count) || 0,
                operatoriesInUse: opUse,
                providersScheduled: Number(summaryData?.providers_scheduled) || 0,
                emptyChairTime: Math.max(0, 8 * opUse - bHours),
            },
        })

    } catch (error) {
        console.error("[CHAIR_UTILIZATION_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
