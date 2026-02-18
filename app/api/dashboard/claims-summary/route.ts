import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export interface ClaimsSummaryResponse {
    pending: number
    paid: number
    rejected: number
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

        const [pendingRes, paidRes, rejectedRes] = await Promise.all([
            supabase
                .from("insurance_claims")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .eq("status", "pending"),
            supabase
                .from("insurance_claims")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .eq("status", "paid"),
            supabase
                .from("insurance_claims")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .eq("status", "rejected"),
        ])

        const summary: ClaimsSummaryResponse = {
            pending: pendingRes.count ?? 0,
            paid: paidRes.count ?? 0,
            rejected: rejectedRes.count ?? 0,
        }

        return NextResponse.json(summary)
    } catch (error) {
        console.error("Dashboard claims-summary error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
