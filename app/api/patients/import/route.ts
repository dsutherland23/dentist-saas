import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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

        const body = await request.json()
        const { patients } = body

        if (!Array.isArray(patients) || patients.length === 0) {
            return NextResponse.json({ error: "Invalid patient data" }, { status: 400 })
        }

        // Prepare patient records with clinic_id
        const patientRecords = patients.map(p => ({
            clinic_id: userData.clinic_id,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email || null,
            phone: p.phone || null,
            date_of_birth: p.date_of_birth || null,
            gender: p.gender || null,
            address: p.address || null,
            insurance_provider: p.insurance_provider || null,
            insurance_policy_number: p.insurance_policy_number || null,
            emergency_contact_name: p.emergency_contact_name || null,
            emergency_contact_phone: p.emergency_contact_phone || null,
        }))

        // Bulk insert patients
        const { data: insertedPatients, error: insertError } = await supabase
            .from("patients")
            .insert(patientRecords)
            .select()

        if (insertError) {
            console.error("[PATIENTS_IMPORT]", insertError)
            return NextResponse.json(
                { error: "Failed to import patients", details: insertError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            imported: insertedPatients?.length || 0,
            patients: insertedPatients
        })
    } catch (error) {
        console.error("[PATIENTS_IMPORT]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
