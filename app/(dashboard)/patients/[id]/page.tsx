import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import PatientProfileClient from "./patient-profile-client"

export const dynamic = "force-dynamic"

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Fetch data
    const [patientRes, apptRes, treatmentRes, filesRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase.from("appointments").select("*, dentists:users(last_name)").eq("patient_id", id).order("start_time", { ascending: false }),
        supabase.from("treatment_records").select("*, dentists:users(last_name)").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("patient_files").select("*").eq("patient_id", id).order("created_at", { ascending: false })
    ])

    if (patientRes.error) {
        console.error("Error fetching patient", patientRes.error)
        return <div className="p-8">Patient not found or access denied.</div>
    }

    return (
        <PatientProfileClient
            patient={patientRes.data}
            appointments={apptRes.data || []}
            treatments={treatmentRes.data || []}
            files={filesRes.data || []}
        />
    )
}
