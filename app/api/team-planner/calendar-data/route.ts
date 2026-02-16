import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { startOfMonth, endOfMonth, format } from "date-fns"

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
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
        }

        const clinicId = userData.clinic_id
        const { searchParams } = new URL(request.url)
        const monthParam = searchParams.get("month") // YYYY-MM
        const currentDate = monthParam ? new Date(monthParam + "-01") : new Date()
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        const startStr = format(start, "yyyy-MM-dd")
        const endStr = format(end, "yyyy-MM-dd")

        // 1. Staff in clinic (exclude patient role)
        const { data: staff, error: staffError } = await supabase
            .from("users")
            .select("id, first_name, last_name, role, email")
            .eq("clinic_id", clinicId)
            .not("role", "eq", "patient")

        if (staffError) throw staffError

        // 2. Active schedules in clinic
        const { data: schedules, error: scheduleError } = await supabase
            .from("staff_schedules")
            .select("id, staff_id, day_of_week, start_time, end_time, is_active")
            .eq("clinic_id", clinicId)
            .eq("is_active", true)

        if (scheduleError) throw scheduleError

        // 3. Approved time off that overlaps [start, end]: start_date <= end AND end_date >= start
        const { data: timeOffRequests, error: requestsError } = await supabase
            .from("time_off_requests")
            .select(`
                id,
                staff_id,
                start_date,
                end_date,
                reason,
                status,
                staff:staff_id(id, first_name, last_name, role)
            `)
            .eq("clinic_id", clinicId)
            .eq("status", "approved")
            .lte("start_date", endStr)
            .gte("end_date", startStr)

        if (requestsError) throw requestsError

        // Normalize staff relation (Supabase may return as "staff" or under FK name)
        const normalizedRequests = (timeOffRequests || []).map((req: any) => ({
            ...req,
            staff: typeof req.staff === "object" && req.staff !== null ? req.staff : {},
        }))

        return NextResponse.json({
            staff: staff || [],
            schedules: schedules || [],
            timeOffRequests: normalizedRequests,
        })
    } catch (error) {
        console.error("[TEAM_PLANNER_CALENDAR]", error)
        return NextResponse.json({ error: "Failed to load calendar data" }, { status: 500 })
    }
}
