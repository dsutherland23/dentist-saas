import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()
        const { procedures_performed, diagnosis, notes, dentist_id, appointment_id } = body

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Get clinic_id
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        const { data, error } = await supabase
            .from("treatment_records")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id: id,
                dentist_id,
                appointment_id,
                procedures_performed,
                diagnosis,
                notes
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("[TREATMENTS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
