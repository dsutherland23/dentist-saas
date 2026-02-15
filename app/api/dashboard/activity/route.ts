import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

        // Parse query parameters for pagination and filtering
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50) // Max 50 items
        const offset = parseInt(searchParams.get('offset') || '0')
        const type = searchParams.get('type') // optional filter: 'appointment', 'payment', 'patient'

        // Fetch recent activity from multiple sources
        const promises = []

        if (!type || type === 'appointment') {
            promises.push(
                supabase
                    .from("appointments")
                    .select(`
                        id,
                        status,
                        treatment_type,
                        created_at,
                        updated_at,
                        start_time,
                        patients (first_name, last_name)
                    `)
                    .eq("clinic_id", clinicId)
                    .order("updated_at", { ascending: false })
                    .limit(limit)
                    .range(offset, offset + limit - 1)
            )
        }

        if (!type || type === 'payment') {
            promises.push(
                supabase
                    .from("payments")
                    .select(`
                        id,
                        amount_paid,
                        created_at,
                        payment_date,
                        invoices (
                            patients (first_name, last_name)
                        )
                    `)
                    .eq("clinic_id", clinicId)
                    .order("created_at", { ascending: false })
                    .limit(limit)
                    .range(offset, offset + limit - 1)
            )
        }

        if (!type || type === 'patient') {
            promises.push(
                supabase
                    .from("patients")
                    .select("id, first_name, last_name, created_at")
                    .eq("clinic_id", clinicId)
                    .order("created_at", { ascending: false })
                    .limit(limit)
                    .range(offset, offset + limit - 1)
            )
        }

        const results = await Promise.all(promises)

        let appointmentsData: any = { data: [], error: null }
        let paymentsData: any = { data: [], error: null }
        let patientsData: any = { data: [], error: null }

        let resultIndex = 0
        if (!type || type === 'appointment') {
            appointmentsData = results[resultIndex++]
        }
        if (!type || type === 'payment') {
            paymentsData = results[resultIndex++]
        }
        if (!type || type === 'patient') {
            patientsData = results[resultIndex++]
        }

        // Combine and format activity
        const activity: any[] = []

        // Add appointment activities (use updated_at so status changes appear in feed)
        appointmentsData.data?.forEach((appt: any) => {
            const patientName = appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown Patient"
            let action = ""
            let type = "info"

            switch (appt.status) {
                case "completed":
                    action = "Completed appointment"
                    type = "success"
                    break
                case "scheduled":
                    action = "Scheduled appointment"
                    type = "info"
                    break
                case "confirmed":
                    action = "Confirmed appointment"
                    type = "info"
                    break
                case "checked_in":
                    action = "Checked in"
                    type = "success"
                    break
                case "in_treatment":
                    action = "In treatment"
                    type = "success"
                    break
                case "cancelled":
                    action = "Cancelled appointment"
                    type = "warning"
                    break
                case "no_show":
                    action = "No-show"
                    type = "warning"
                    break
                case "pending":
                case "unconfirmed":
                    action = "Pending / unconfirmed"
                    type = "info"
                    break
                default:
                    action = `Appointment ${appt.status}`
                    type = "info"
            }

            activity.push({
                id: appt.id,
                entityType: "appointment",
                name: patientName,
                action,
                time: appt.updated_at || appt.created_at,
                type,
                treatment_type: appt.treatment_type,
                start_time: appt.start_time,
            })
        })

        // Add payment activities
        paymentsData.data?.forEach((payment: any) => {
            const patientName = payment.invoices?.patients
                ? `${payment.invoices.patients.first_name} ${payment.invoices.patients.last_name}`
                : "Unknown Patient"

            activity.push({
                name: patientName,
                action: `Payment received - $${parseFloat(payment.amount_paid).toFixed(2)}`,
                time: payment.created_at,
                type: "success"
            })
        })

        // Add new patient activities
        patientsData.data?.forEach((patient: any) => {
            activity.push({
                name: `${patient.first_name} ${patient.last_name}`,
                action: "New patient registration",
                time: patient.created_at,
                type: "info"
            })
        })

        // Sort by time
        activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        
        // Limit results if no pagination (dashboard request)
        const finalActivity = offset === 0 && limit === 5 ? activity.slice(0, 10) : activity

        // Format time to relative
        const formatTime = (timestamp: string) => {
            const now = new Date()
            const then = new Date(timestamp)
            const diffMs = now.getTime() - then.getTime()
            const diffMins = Math.floor(diffMs / 60000)

            if (diffMins < 1) return "Just now"
            if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

            const diffHours = Math.floor(diffMins / 60)
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

            const diffDays = Math.floor(diffHours / 24)
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        }

        const formattedActivity = finalActivity.map(item => ({
            ...item,
            time: formatTime(item.time),
            timestamp: item.time // Keep original for sorting/filtering
        }))

        return NextResponse.json({ 
            activity: formattedActivity,
            hasMore: finalActivity.length === limit && offset + limit < 100 // Rough estimate
        })

    } catch (error) {
        console.error("Dashboard activity error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
