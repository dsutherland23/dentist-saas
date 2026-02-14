import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

const VALID_STATUSES = ["pending", "unconfirmed", "scheduled", "confirmed", "checked_in", "in_treatment", "completed", "cancelled", "no_show"]

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
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
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const body = await request.json().catch(() => ({}))
        const { status } = body as { status?: string }

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Valid status required: " + VALID_STATUSES.join(", ") },
                { status: 400 }
            )
        }

        // Only update status - timestamps are set by DB trigger if columns exist
        const { data, error } = await supabase
            .from("appointments")
            .update({ status })
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) {
            console.error("[APPOINTMENTS_PATCH] Supabase error:", error.message, error.code)
            throw error
        }

        revalidatePath("/calendar")
        revalidatePath("/patients")
        if (data?.patient_id) revalidatePath(`/patients/${data.patient_id}`)

        return NextResponse.json(data)
    } catch (error) {
        console.error("[APPOINTMENTS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
