import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { insertAuditLog, getClientIp } from "@/lib/audit-log"
import { canSubmitClaim } from "@/lib/insurance-permissions"

/**
 * POST /api/insurance/claim
 * Submit 837D claim (stub: create claims row; real impl would send to clearinghouse).
 * Allowed: Billing (accountant), Admin, optionally FrontDesk (receptionist).
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()
        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        if (!canSubmitClaim(userData.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const {
            patient_id,
            policy_id,
            invoice_id,
            total_amount,
            insurance_estimate,
            patient_responsibility,
        } = body

        if (!patient_id || !total_amount) {
            return NextResponse.json({ error: "Missing required fields: patient_id, total_amount" }, { status: 400 })
        }

        const claim_number = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

        const { data: claim, error } = await supabase
            .from("claims")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id,
                policy_id: policy_id ?? null,
                invoice_id: invoice_id ?? null,
                claim_number,
                status: "submitted",
                total_amount: Number(total_amount),
                insurance_estimate: insurance_estimate != null ? Number(insurance_estimate) : null,
                patient_responsibility: patient_responsibility != null ? Number(patient_responsibility) : null,
                submitted_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) throw error

        await insertAuditLog(supabase, {
            clinic_id: userData.clinic_id,
            user_id: user.id,
            action: "insurance_claim_submitted",
            record_type: "claim",
            record_id: claim.id,
            ip_address: getClientIp(req),
        })

        return NextResponse.json(claim)
    } catch (error) {
        console.error("[INSURANCE_CLAIM_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
