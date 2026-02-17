import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const dentistId = searchParams.get("dentistId")

        if (!dentistId) {
            return NextResponse.json({ error: "dentistId is required" }, { status: 400 })
        }

        // Verify the requesting user is accessing their own appointments
        if (dentistId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        // Fetch ALL appointments for this dentist (no date range limit)
        const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                end_time,
                treatment_type,
                status,
                room,
                notes,
                patient_id,
                patients (first_name, last_name, phone),
                dentists:users (first_name, last_name)
            `)
            .eq("clinic_id", userData.clinic_id)
            .eq("dentist_id", dentistId)
            .order("start_time", { ascending: false })

        if (apptError) {
            console.error("Error fetching appointments:", apptError)
            return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
        }

        return NextResponse.json({ appointments: appointments || [] })

    } catch (error) {
        console.error("My appointments API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
