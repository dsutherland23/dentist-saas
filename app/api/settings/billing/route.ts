import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET billing info
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
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

        // Get clinic billing info
        const { data: clinic } = await supabase
            .from("clinics")
            .select("subscription_plan, subscription_status")
            .eq("id", userData.clinic_id)
            .single()

        // Get billing history (latest 5 invoices)
        const { data: invoices } = await supabase
            .from("invoices")
            .select("id, invoice_number, issue_date, total_amount, status")
            .eq("clinic_id", userData.clinic_id)
            .order("issue_date", { ascending: false })
            .limit(5)

        return NextResponse.json({
            plan: clinic?.subscription_plan || "starter",
            status: clinic?.subscription_status || "active",
            invoices: invoices || [],
            payment_method: {
                last4: "4242",
                brand: "visa",
                expiry: "12/2025"
            }
        })

    } catch (error) {
        console.error("Billing GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
