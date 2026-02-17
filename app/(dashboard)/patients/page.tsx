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
    
    // Calculate date ranges for statistics
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthsAgoISO = sixMonthsAgo.toISOString()

    const [patientsRes, todayAppointmentsRes, pastAppointmentsRes, recentAppointmentsRes] = await Promise.all([
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
            .in("status", ["pending", "unconfirmed", "scheduled", "confirmed", "checked_in", "in_treatment", "no_show", "cancelled"]),

        // Fetch past appointments for last visit calculation
        supabase
            .from("appointments")
            .select("patient_id, start_time")
            .eq("clinic_id", clinicId)
            .lt("start_time", now.toISOString())
            .order("start_time", { ascending: false }),

        // Fetch appointments from last 6 months for active/overdue calculation
        supabase
            .from("appointments")
            .select("patient_id, start_time")
            .eq("clinic_id", clinicId)
            .gte("start_time", sixMonthsAgoISO)
            .lt("start_time", now.toISOString())
    ])

    const { data: patients, error } = patientsRes

    if (error) {
        console.error("Error fetching patients:", error)
        return <div className="p-8">Error loading patients. Please try refreshing.</div>
    }

    const todayAppointments = todayAppointmentsRes.data || []
    const pastAppointments = pastAppointmentsRes.data || []
    const recentAppointments = recentAppointmentsRes.data || []

    // Calculate last visit for each patient
    const lastVisits = new Map<string, string>()
    pastAppointments.forEach((appt) => {
        if (!lastVisits.has(appt.patient_id)) {
            lastVisits.set(appt.patient_id, appt.start_time)
        }
    })

    // Calculate active patients (those with appointments in last 6 months)
    const activePatientIds = new Set(recentAppointments.map(appt => appt.patient_id))

    // Calculate statistics
    const totalPatients = patients?.length || 0
    const activePatients = patients?.filter(p => activePatientIds.has(p.id)).length || 0
    const newThisMonth = patients?.filter(p => p.created_at >= monthStart).length || 0
    const overduePatients = patients?.filter(p => !activePatientIds.has(p.id)).length || 0

    const stats = {
        total: totalPatients,
        active: activePatients,
        newThisMonth: newThisMonth,
        overdue: overduePatients
    }

    return (
        <Suspense fallback={<div className="p-8">Loading patients...</div>}>
            <PatientsClient
                initialPatients={patients || []}
                todayAppointments={todayAppointments}
                lastVisits={Object.fromEntries(lastVisits)}
                activePatientIds={Array.from(activePatientIds)}
                stats={stats}
            />
        </Suspense>
    )
}
