import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { startOfWeek, endOfWeek, format, differenceInMinutes } from "date-fns"

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
        const weekParam = searchParams.get("week_start") // YYYY-MM-DD
        const weekStart = weekParam
            ? startOfWeek(new Date(weekParam), { weekStartsOn: 1 })
            : startOfWeek(new Date(), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

        // 1. Staff in clinic
        const { data: staff, error: staffError } = await supabase
            .from("users")
            .select("id, first_name, last_name, role")
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

        // 3. Appointments in week (not cancelled)
        const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select("id, dentist_id, start_time, end_time, status")
            .eq("clinic_id", clinicId)
            .gte("start_time", weekStart.toISOString())
            .lte("start_time", weekEnd.toISOString())
            .not("status", "eq", "cancelled")

        if (apptError) throw apptError

        const colors = ["#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"]
        const staffList = staff || []
        const scheduleList = schedules || []
        const apptList = appointments || []

        const chartData = staffList.map((member: any, index: number) => {
            const memberSchedules = scheduleList.filter((s: any) => s.staff_id === member.id)
            let weeklyCapacityMinutes = 0
            memberSchedules.forEach((s: any) => {
                if (s.start_time && s.end_time) {
                    const [sH, sM] = String(s.start_time).split(":").map(Number)
                    const [eH, eM] = String(s.end_time).split(":").map(Number)
                    weeklyCapacityMinutes += eH * 60 + eM - (sH * 60 + sM)
                }
            })

            const memberAppts = apptList.filter((a: any) => a.dentist_id === member.id)
            const bookedMinutes = memberAppts.reduce((acc: number, a: any) => {
                return acc + differenceInMinutes(new Date(a.end_time), new Date(a.start_time))
            }, 0)

            const capacityHours = Math.round((weeklyCapacityMinutes / 60) * 10) / 10
            const bookedHours = Math.round((bookedMinutes / 60) * 10) / 10

            return {
                name: `${member.first_name?.[0] || ""}. ${member.last_name || ""}`,
                capacity: capacityHours || 0,
                booked: bookedHours || 0,
                utilization: capacityHours > 0 ? Math.round((bookedHours / capacityHours) * 100) : 0,
                color: colors[index % colors.length],
            }
        }).filter((w: any) => w.capacity > 0 || w.booked > 0)

        return NextResponse.json({
            chartData,
            weekRange: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
            weekStartLabel: format(weekStart, "MMM d"),
            weekEndLabel: format(weekEnd, "MMM d, yyyy"),
        })
    } catch (error) {
        console.error("[TEAM_PLANNER_WORKLOAD]", error)
        return NextResponse.json({ error: "Failed to load workload data" }, { status: 500 })
    }
}
