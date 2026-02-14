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

    // Get Clinic ID (redirects to /onboarding if user has no clinic)
    const clinicId = await getClinicId()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

    const [patientsRes, todayAppointmentsRes] = await Promise.all([
        supabase
            .from("patients")
            .select("*")
            .eq("clinic_id", clinicId)
            .order("created_at", { ascending: false }),

        supabase
            .from("appointments")
            .select(`
                id,
                patient_id,
                start_time,
                end_time,
                status,
                treatment_type
            `)
            .eq("clinic_id", clinicId)
            .gte("start_time", todayStart)
            .lte("start_time", todayEnd)
            .in("status", ["pending", "unconfirmed", "scheduled", "confirmed", "checked_in", "in_treatment", "no_show", "cancelled"])
    ])

    const { data: patients, error } = patientsRes

    if (error) {
        console.error("Error fetching patients:", error)
        return <div className="p-8">Error loading patients. Please try refreshing.</div>
    }

    const todayAppointments = todayAppointmentsRes.data || []

    return (
        <Suspense fallback={<div className="p-8">Loading patients...</div>}>
            <PatientsClient
                initialPatients={patients || []}
                todayAppointments={todayAppointments}
            />
        </Suspense>
    )
}
