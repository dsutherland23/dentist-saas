import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const clinicId = userData.clinic_id

        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                treatment_type,
                status,
                patient_id,
                patients (
                    id,
                    first_name,
                    last_name,
                    phone,
                    email
                )
            `)
            .eq("clinic_id", clinicId)
            .in("status", ["no_show", "cancelled", "unconfirmed"])
            .gte("start_time", sevenDaysAgo.toISOString())
            .lte("start_time", todayEnd.toISOString())
            .order("start_time", { ascending: false })
            .limit(20)

        if (apptError) {
            console.error("Follow-up fetch error:", apptError)
            return NextResponse.json({ error: "Failed to fetch follow-up data" }, { status: 500 })
        }

        const followUps = (appointments || []).map((appt: any) => {
            const patient = appt.patients
            const patientName = patient
                ? `${patient.first_name} ${patient.last_name}`.trim()
                : "Unknown Patient"
            return {
                id: appt.id,
                patient_id: appt.patient_id,
                patient_name: patientName,
                phone: patient?.phone || null,
                email: patient?.email || null,
                status: appt.status,
                start_time: appt.start_time,
                treatment_type: appt.treatment_type || "Appointment",
            }
        })

        return NextResponse.json({ followUps })
    } catch (error) {
        console.error("Dashboard follow-up error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
