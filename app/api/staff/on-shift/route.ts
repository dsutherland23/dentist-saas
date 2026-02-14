import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

        const now = new Date()
        const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
        const currentTime = now.toTimeString().split(' ')[0] // HH:mm:ss
        const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD

        // Get all staff for the clinic
        const { data: staff, error: staffError } = await supabase
            .from("users")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .neq("role", "patient")

        if (staffError) throw staffError

        const staffIds = staff.map(s => s.id)

        // Get schedules for today
        const { data: schedules, error: scheduleError } = await supabase
            .from("staff_schedules")
            .select("*")
            .in("staff_id", staffIds)
            .eq("day_of_week", dayOfWeeksToDb(dayOfWeek))
            .eq("is_active", true)

        if (scheduleError) throw scheduleError

        // Get overrides for today
        const { data: overrides, error: overrideError } = await supabase
            .from("staff_schedule_overrides")
            .select("*")
            .in("staff_id", staffIds)
            .eq("override_date", currentDate)

        if (overrideError) throw overrideError

        const onShiftStaff = staff.map(s => {
            const schedule = schedules?.find(sch => sch.staff_id === s.id)
            const override = overrides?.find(ovr => ovr.staff_id === s.id)

            let isOnShift = false

            if (override) {
                if (override.is_available) {
                    isOnShift = currentTime >= override.start_time && currentTime <= override.end_time
                } else {
                    isOnShift = false // Specifically marked as away
                }
            } else if (schedule) {
                isOnShift = currentTime >= schedule.start_time && currentTime <= schedule.end_time
            }

            return {
                ...s,
                isOnShift
            }
        })

        return NextResponse.json(onShiftStaff)
    } catch (error) {
        console.error("[STAFF_ON_SHIFT_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

function dayOfWeeksToDb(jsDay: number) {
    // JS: 0=Sun, 1=Mon, ..., 6=Sat
    // If DB uses 1=Mon, ..., 7=Sun or something else, adjust here.
    // Based on previous search, 1, 2, 3, 5 were Mon, Tue, Wed, Fri.
    // So 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun (or 0=Sun)
    // Let's assume 1=Mon, ..., 0=Sun is 7.
    return jsDay === 0 ? 7 : jsDay
}
