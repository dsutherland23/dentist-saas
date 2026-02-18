import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * DELETE /api/patients/[id]
 * Delete a patient. RLS ensures only clinic staff can delete their clinic's patients.
 * Returns a clear error if delete fails (e.g. FK constraint from another table).
 */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
            return NextResponse.json({ error: "No clinic assigned. You must belong to a clinic to delete patients." }, { status: 403 })
        }

        const { data: patient, error: fetchError } = await supabase
            .from("patients")
            .select("id")
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (fetchError || !patient) {
            return NextResponse.json({ error: "Patient not found or you don't have access to delete them." }, { status: 404 })
        }

        const { error: deleteError } = await supabase
            .from("patients")
            .delete()
            .eq("id", id)

        if (deleteError) {
            const code = deleteError.code
            const msg = deleteError.message || "Failed to delete patient"
            if (code === "23503") {
                return NextResponse.json({
                    error: "Cannot delete this patient because they have linked records (e.g. invoices, treatment plans, or files). Remove or reassign those first.",
                }, { status: 400 })
            }
            return NextResponse.json({ error: msg }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PATIENTS_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
