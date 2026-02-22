import { use } from "react"
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import PatientProfileClient from "./patient-profile-client"

export const dynamic = "force-dynamic"

/** Unwrap params with React.use() to avoid Next.js 16 params enumeration warning (dev overlay serialization). */
export default function PatientPage(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params)
    return <PatientPageContent id={id} />
}

async function PatientPageContent({ id }: { id: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const patientRes = await supabase.from("patients").select("*").eq("id", id).single()
    if (patientRes.error) {
        console.error("Error fetching patient", patientRes.error)
        return <div className="p-8">Patient not found or access denied.</div>
    }
    const patient = patientRes.data
    const clinicId = patient.clinic_id

    const [apptRes, treatmentRes, filesRes, availableTreatmentsRes, dentistsRes] = await Promise.all([
        supabase.from("appointments").select("*, dentists:users(first_name, last_name, profile_picture_url)").eq("patient_id", id).order("start_time", { ascending: false }),
        supabase.from("treatment_records").select("*, dentists:users(first_name, last_name, profile_picture_url)").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("patient_files").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("treatments").select("*").eq("is_active", true).order("name", { ascending: true }),
        supabase.from("users").select("id, first_name, last_name, role, profile_picture_url").eq("clinic_id", clinicId).in("role", ["dentist", "clinic_admin", "super_admin"])
    ])

    return (
        <PatientProfileClient
            patient={patient}
            appointments={apptRes.data || []}
            treatments={treatmentRes.data || []}
            files={filesRes.data || []}
            availableTreatments={availableTreatmentsRes.data || []}
            dentists={dentistsRes.data || []}
            currentUserId={user.id}
        />
    )
}
