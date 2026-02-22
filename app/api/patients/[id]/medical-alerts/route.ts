import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()
        const { allergies, medical_conditions, medications } = body

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const updatePayload: Record<string, unknown> = {}
        if (allergies !== undefined) updatePayload.allergies = allergies
        if (medical_conditions !== undefined) updatePayload.medical_conditions = medical_conditions
        if (medications !== undefined) updatePayload.medications = medications

        const { data, error } = await supabase
            .from("patients")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("[MEDICAL_ALERTS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
