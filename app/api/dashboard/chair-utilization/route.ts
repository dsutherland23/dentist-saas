import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const WORKDAY_HOURS = 8

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

        const clinicId = userData.clinic_id
        const { searchParams } = new URL(req.url)
        const dateParam = searchParams.get("date")
        const today = new Date()
        const dateStr =
            dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
                ? dateParam
                : today.toISOString().slice(0, 10)
        const dayStart = new Date(dateStr + "T00:00:00.000Z")
        const dayEnd = new Date(dateStr + "T23:59:59.999Z")

        // Fetch all appointments for the day (same date range as dashboard schedule)
        const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select("id, start_time, end_time, status, room, dentist_id")
            .eq("clinic_id", clinicId)
            .gte("start_time", dayStart.toISOString())
            .lte("start_time", dayEnd.toISOString())

        if (apptError) {
            console.error("[CHAIR_UTILIZATION] appointments error:", apptError)
            return NextResponse.json({ error: "Failed to load appointments" }, { status: 500 })
        }

        const list = appointments ?? []

        // Today's schedule summary (all appointments for the day)
        const totalAppointments = list.length
        const completedCount = list.filter((a: any) => a.status === "completed").length
        const cancelledCount = list.filter((a: any) => a.status === "cancelled").length
        const noShowCount = list.filter((a: any) => a.status === "no_show").length

        // Booked hours: sum duration of non-cancelled, non-no_show appointments
        const activeStatuses = ["pending", "unconfirmed", "scheduled", "confirmed", "checked_in", "in_treatment", "completed"]
        const activeAppointments = list.filter((a: any) => activeStatuses.includes(a.status))
        const bookedHours = activeAppointments.reduce((sum: number, a: any) => {
            const start = new Date(a.start_time).getTime()
            const end = new Date(a.end_time).getTime()
            return sum + (end - start) / (1000 * 60 * 60)
        }, 0)

        // Operatories in use: distinct non-empty room values
        const roomsUsed = new Set(
            activeAppointments.map((a: any) => (a.room && String(a.room).trim()) || null).filter(Boolean)
        )
        const operatoriesInUse = roomsUsed.size
        const providersScheduled = new Set(activeAppointments.map((a: any) => a.dentist_id).filter(Boolean)).size

        // Empty chair time: (workday hours × chairs) - booked hours (only count chairs that had at least one appt with a room)
        const emptyChairTime = Math.max(0, WORKDAY_HOURS * Math.max(operatoriesInUse, 1) - bookedHours)

        // Per-chair utilization: group by room + dentist_id
        const byChair = new Map<string, { dentist_id: string; appointments: number; hours: number }>()
        for (const a of activeAppointments) {
            const room = (a.room && String(a.room).trim()) || "Unassigned"
            const key = `${room}|${a.dentist_id || ""}`
            const start = new Date(a.start_time).getTime()
            const end = new Date(a.end_time).getTime()
            const hours = (end - start) / (1000 * 60 * 60)
            if (!byChair.has(key)) {
                byChair.set(key, { dentist_id: a.dentist_id || "", appointments: 0, hours: 0 })
            }
            const cur = byChair.get(key)!
            cur.appointments += 1
            cur.hours += hours
        }

        // Dentist names for enrichment
        const dentistIds = [...new Set(Array.from(byChair.values()).map((c) => c.dentist_id).filter(Boolean))] as string[]
        let dentistNames: Record<string, string> = {}
        if (dentistIds.length > 0) {
            const { data: dentists } = await supabase
                .from("users")
                .select("id, first_name, last_name")
                .in("id", dentistIds)
            if (dentists) {
                dentistNames = dentists.reduce(
                    (acc, d) => {
                        acc[d.id] = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "Unassigned"
                        return acc
                    },
                    {} as Record<string, string>
                )
            }
        }

        const utilizationByChair = Array.from(byChair.entries()).map(([key, cur]) => {
            const [operatory] = key.split("|")
            const hours = Math.round(cur.hours * 10) / 10
            const pct = WORKDAY_HOURS > 0 ? Math.min(100, Math.round((cur.hours / WORKDAY_HOURS) * 1000) / 10) : 0
            const utilizationLevel =
                pct >= 90 ? "excellent" : pct >= 70 ? "good" : "needs-improvement"
            return {
                operatory: operatory || "Unassigned",
                dentist_id: cur.dentist_id,
                dentist_name: dentistNames[cur.dentist_id] || "Unassigned",
                total_appointments: cur.appointments,
                total_hours: hours,
                utilization_percent: pct,
                utilizationLevel,
            }
        })

        // Sort by operatory then dentist
        utilizationByChair.sort((a, b) => {
            if (a.operatory !== b.operatory) return (a.operatory || "").localeCompare(b.operatory || "")
            return (a.dentist_name || "").localeCompare(b.dentist_name || "")
        })

        return NextResponse.json({
            utilizationByChair,
            todaySummary: {
                totalAppointments,
                bookedHours: Math.round(bookedHours * 10) / 10,
                completedCount,
                cancelledCount,
                noShowCount,
                operatoriesInUse,
                providersScheduled,
                emptyChairTime: Math.round(emptyChairTime * 10) / 10,
            },
        })
    } catch (error) {
        console.error("[CHAIR_UTILIZATION_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
