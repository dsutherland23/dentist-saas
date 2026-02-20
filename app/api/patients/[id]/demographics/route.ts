import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/patients/[id]/demographics
 * Update patient first_name, last_name, date_of_birth. Optional fields; only provided keys are updated.
 * Used e.g. after ID scan to correct or complete demographics. RLS ensures clinic access.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json().catch(() => ({}))
        const { first_name, last_name, date_of_birth } = body as {
            first_name?: string
            last_name?: string
            date_of_birth?: string | null
        }

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
            return NextResponse.json({ error: "No clinic assigned" }, { status: 403 })
        }

        const updates: { first_name?: string | null; last_name?: string | null; date_of_birth?: string | null } = {}
        if (typeof first_name === "string") {
            const t = first_name.trim()
            if (t.length > 100) return NextResponse.json({ error: "First name must be 100 characters or less" }, { status: 400 })
            updates.first_name = t || null
        }
        if (typeof last_name === "string") {
            const t = last_name.trim()
            if (t.length > 100) return NextResponse.json({ error: "Last name must be 100 characters or less" }, { status: 400 })
            updates.last_name = t || null
        }
        if (date_of_birth !== undefined) {
            if (date_of_birth === null || date_of_birth === "") {
                updates.date_of_birth = null
            } else if (typeof date_of_birth === "string") {
                const d = new Date(date_of_birth)
                if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date_of_birth" }, { status: 400 })
                updates.date_of_birth = date_of_birth.trim()
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update. Send first_name, last_name, and/or date_of_birth." }, { status: 400 })
        }

        const { data: patient, error } = await supabase
            .from("patients")
            .update(updates)
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select("id, first_name, last_name, date_of_birth")
            .single()

        if (error) {
            console.error("[PATIENT_DEMOGRAPHICS_PATCH]", error)
            return NextResponse.json({ error: "Failed to update demographics" }, { status: 500 })
        }

        if (!patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 })
        }

        return NextResponse.json(patient)
    } catch (error) {
        console.error("[PATIENT_DEMOGRAPHICS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
