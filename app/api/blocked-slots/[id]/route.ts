import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

async function getClinicIdFromAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single()
    return data?.clinic_id ?? null
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const clinicId = await getClinicIdFromAuth(supabase)
        if (!clinicId) return NextResponse.json({ error: "Unauthorized or clinic not found" }, { status: 401 })

        const { error } = await supabase
            .from("blocked_slots")
            .delete()
            .eq("id", id)
            .eq("clinic_id", clinicId)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[BLOCKED_SLOTS_DELETE]", error)
        return NextResponse.json({ error: "Failed to delete blocked slot" }, { status: 500 })
    }
}
