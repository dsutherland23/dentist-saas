import { createClient } from "@/lib/supabase-server"
import PatientsClient from "./patients-client"
import { getClinicId } from "./actions"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default async function PatientsPage() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Get Clinic ID
    let clinicId
    try {
        clinicId = await getClinicId()
    } catch (e) {
        // Redirect to onboarding or show error if clinic not found
        // For now let's just log and throw since onboarding should happen at signup on success
        console.error(e)
        // If no clinic, maybe the user is not fully onboarded.
        // But let's assume valid state for now.
        return <div className="p-8">Error: User has no clinic associated. Please contact support.</div>
    }

    const { data: patients, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching patients:", error)
        return <div className="p-8">Error loading patients. Please try refreshing.</div>
    }

    // Transform data to match client interface if needed
    // The DB schema fields are snake_case, JS prefers camelCase usually but I used snake_case in interface too.
    // PatientsClient interface: id, first_name, last_name, email, phone, insurance_provider
    // DB: id, first_name, last_name, email, phone, insurance_provider... perfect match.

    return (
        <Suspense fallback={<div className="p-8">Loading patients...</div>}>
            <PatientsClient initialPatients={patients || []} />
        </Suspense>
    )
}
