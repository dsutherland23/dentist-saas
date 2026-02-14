import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

async function getClinicIdFromAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single()
    return data?.clinic_id ?? null
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const clinicId = await getClinicIdFromAuth(supabase)
        if (!clinicId) return NextResponse.json({ error: "Unauthorized or clinic not found" }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const staffId = searchParams.get("staff_id")
        const start = searchParams.get("start")
        const end = searchParams.get("end")

        let query = supabase
            .from("blocked_slots")
            .select("*")
            .eq("clinic_id", clinicId)
            .order("start_time", { ascending: true })

        if (staffId) query = query.eq("staff_id", staffId)
        // Overlap: slot overlaps [start,end] if slot.start < end AND slot.end > start
        if (start) query = query.lt("start_time", end || "9999") // slot.start < range.end
        if (end) query = query.gt("end_time", start || "0000")   // slot.end > range.start

        const { data, error } = await query

        if (error) throw error
        return NextResponse.json(data || [])
    } catch (error) {
        console.error("[BLOCKED_SLOTS_GET]", error)
        return NextResponse.json({ error: "Failed to fetch blocked slots" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const clinicId = await getClinicIdFromAuth(supabase)
        if (!clinicId) return NextResponse.json({ error: "Unauthorized or clinic not found" }, { status: 401 })
        const body = await req.json()
        const { staff_id, start_time, end_time, reason } = body

        if (!staff_id || !start_time || !end_time) {
            return NextResponse.json({ error: "Missing required fields: staff_id, start_time, end_time" }, { status: 400 })
        }

        const startDate = new Date(start_time)
        const endDate = new Date(end_time)
        if (endDate <= startDate) {
            return NextResponse.json({ error: "end_time must be after start_time" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("blocked_slots")
            .insert({
                clinic_id: clinicId,
                staff_id,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                reason: reason || null,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("[BLOCKED_SLOTS_POST]", error)
        const raw = error as { message?: string; code?: string; details?: string }
        const message = raw?.message || (error instanceof Error ? error.message : "Failed to create blocked slot")
        const isTableMissing = message.includes("relation") && message.includes("does not exist")
        const isRlsDenied = message.includes("row-level security") || message.includes("policy")
        const userMsg = isTableMissing
            ? "Blocked slots feature is not set up. Run scripts/add-blocked-slots.sql in Supabase SQL Editor."
            : isRlsDenied
                ? "Permission denied. Run scripts/add-blocked-slots.sql to update RLS policies."
                : message
        return NextResponse.json({ error: userMsg }, { status: 500 })
    }
}
