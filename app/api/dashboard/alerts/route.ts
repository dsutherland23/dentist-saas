import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export interface DashboardAlertsResponse {
    unpaidInvoices: Array<{
        id: string
        invoice_number: string | null
        balance_due: number
        due_date: string | null
        patient_name: string
    }>
}

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

        // Unpaid = not paid/cancelled; use explicit status list (matches financial-metrics)
        const UNPAID_STATUSES = ["draft", "sent", "partially_paid", "overdue"]
        const { data: invoices, error: invError } = await supabase
            .from("invoices")
            .select(`
                id,
                invoice_number,
                balance_due,
                due_date,
                status,
                patient:patients(first_name, last_name)
            `)
            .eq("clinic_id", clinicId)
            .in("status", UNPAID_STATUSES)
            .order("due_date", { ascending: true })
            .limit(10)

        if (invError) {
            console.error("Dashboard alerts unpaid invoices:", invError)
            return NextResponse.json({ unpaidInvoices: [] } as DashboardAlertsResponse)
        }

        const unpaidInvoices = (invoices || [])
            .filter((inv: any) => Number(inv.balance_due) > 0)
            .map((inv: any) => {
                const patient = inv.patient
                const patientName = patient
                    ? `${[patient.first_name, patient.last_name].filter(Boolean).join(" ")}`.trim()
                    : "Unknown"
                return {
                    id: inv.id,
                    invoice_number: inv.invoice_number ?? null,
                    balance_due: parseFloat(inv.balance_due || 0),
                    due_date: inv.due_date ?? null,
                    patient_name: patientName || "Unknown",
                }
            })

        return NextResponse.json({ unpaidInvoices } as DashboardAlertsResponse)
    } catch (error) {
        console.error("Dashboard alerts error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
