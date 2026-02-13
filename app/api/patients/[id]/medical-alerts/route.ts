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
        const { allergies, medical_conditions } = body

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { data, error } = await supabase
            .from("patients")
            .update({ allergies, medical_conditions })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("[MEDICAL_ALERTS_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
