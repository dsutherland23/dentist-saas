import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import CalendarClient from "./calendar-client"
import { getClinicId } from "@/app/(dashboard)/patients/actions"

export const dynamic = "force-dynamic"

type CalendarPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> }

export default async function CalendarPage({ searchParams: searchParamsPromise }: CalendarPageProps) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const searchParams = searchParamsPromise ? await searchParamsPromise : {}
    const appointmentId = typeof searchParams?.appointmentId === "string" ? searchParams.appointmentId : null

    // getClinicId() redirects to /onboarding if no clinic — do NOT wrap in try-catch
    // as redirect() throws a special error that must propagate
    const clinicId = await getClinicId()

    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setDate(rangeStart.getDate() - 14)
    const rangeEnd = new Date(now)
    rangeEnd.setDate(rangeEnd.getDate() + 60)

    // Parallel fetching (incl. clinic for receipt/referral branding)
    const [patientsRes, dentistsRes, appsRes, blocksRes, clinicRes] = await Promise.all([
        supabase.from("patients").select("id, first_name, last_name").eq("clinic_id", clinicId),
        supabase.from("users").select("id, first_name, last_name, role").eq("clinic_id", clinicId),
        supabase.from("appointments")
            .select(`
                *,
                patients (first_name, last_name, phone),
                dentists:users (first_name, last_name)
            `)
            .eq("clinic_id", clinicId)
            .neq("status", "completed"),
        supabase.from("blocked_slots")
            .select("*")
            .eq("clinic_id", clinicId)
            .gte("end_time", rangeStart.toISOString())
            .lte("start_time", rangeEnd.toISOString())
            .order("start_time", { ascending: true }),
        supabase.from("clinics").select("name, logo_url, phone, website").eq("id", clinicId).single()
    ])

    if (patientsRes.error || dentistsRes.error || appsRes.error) {
        console.error("Calendar data fetch errors:", {
            patients: patientsRes.error,
            dentists: dentistsRes.error,
            appointments: appsRes.error,
            blockedSlots: blocksRes.error
        })
    }

    const dentists = dentistsRes.data?.filter(u => u.role === 'dentist' || u.role === 'clinic_admin') || []
    const blockedSlots = blocksRes.error ? [] : (blocksRes.data || [])

    const clinic = clinicRes.data && !clinicRes.error
        ? {
            name: clinicRes.data.name ?? "",
            logo_url: clinicRes.data.logo_url ?? null,
            phone: clinicRes.data.phone ?? null,
            website: clinicRes.data.website ?? null,
        }
        : null

    return (
        <CalendarClient
            initialAppointments={appsRes.data || []}
            initialBlockedSlots={blockedSlots}
            patients={patientsRes.data || []}
            dentists={dentists}
            clinic={clinic}
            currentUserId={user.id}
            initialAppointmentId={appointmentId}
        />
    )
}
