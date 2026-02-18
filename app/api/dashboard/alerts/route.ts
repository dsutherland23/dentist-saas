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
            .not("status", "in", "('paid','cancelled')")
            .order("due_date", { ascending: true })
            .limit(10)

        if (invError) {
            console.error("Dashboard alerts unpaid invoices:", invError)
            return NextResponse.json({ unpaidInvoices: [] } as DashboardAlertsResponse)
        }

        const unpaidInvoices = (invoices || []).map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number ?? null,
            balance_due: parseFloat(inv.balance_due || 0),
            due_date: inv.due_date ?? null,
            patient_name: inv.patient
                ? `${inv.patient.first_name ?? ""} ${inv.patient.last_name ?? ""}`.trim()
                : "Unknown",
        }))

        return NextResponse.json({ unpaidInvoices } as DashboardAlertsResponse)
    } catch (error) {
        console.error("Dashboard alerts error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
