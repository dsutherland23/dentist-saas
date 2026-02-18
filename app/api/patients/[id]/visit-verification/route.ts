import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * GET /api/patients/[id]/visit-verification
 * Returns minimal patient fields used to auto-verify visit flow requirements
 * (insurance, contact, allergies, medical) and for the calendar name hover summary.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: patient, error } = await supabase
            .from("patients")
            .select("id, first_name, last_name, phone, email, address, insurance_provider, insurance_policy_number, allergies, medical_conditions")
            .eq("id", id)
            .single()

        if (error || !patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 })
        }

        return NextResponse.json(patient)
    } catch (err) {
        console.error("[VISIT_VERIFICATION_GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
