import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import CalendarClient from "./calendar-client"
import { getClinicId } from "@/app/(dashboard)/patients/actions"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    let clinicId
    try {
        clinicId = await getClinicId()
    } catch (e) {
        return <div className="p-8">Error loading clinic data. Please ensure you are logged in correctly.</div>
    }

    // Parallel fetching
    const [patientsRes, dentistsRes, appsRes] = await Promise.all([
        supabase.from("patients").select("id, first_name, last_name").eq("clinic_id", clinicId),

        // Fetch all users for now as dentists might be just 'users' in some setups, but filtering by role is better
        supabase.from("users").select("id, first_name, last_name, role").eq("clinic_id", clinicId),

        supabase.from("appointments")
            .select(`
                *,
                patients (first_name, last_name),
                dentists:users (first_name, last_name)
            `)
            .eq("clinic_id", clinicId)
    ])

    // Filter dentists strictly in JS or just pass all users? 
    // Let's pass all users for the dropdown to be flexible, or filter.
    // Ideally only show dentists.
    const dentists = dentistsRes.data?.filter(u => u.role === 'dentist' || u.role === 'clinic_admin') || []

    return (
        <CalendarClient
            initialAppointments={appsRes.data || []}
            patients={patientsRes.data || []}
            dentists={dentists}
        />
    )
}
