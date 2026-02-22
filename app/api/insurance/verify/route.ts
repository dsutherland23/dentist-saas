import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { insertAuditLog, getClientIp } from "@/lib/audit-log"
import { canVerifyEligibility } from "@/lib/insurance-permissions"

/**
 * POST /api/insurance/verify
 * Send 270 eligibility request; receive 271; parse benefits; store snapshot; return eligibility.
 * Stub: stores a mock eligibility_snapshot and updates verification_status. Real implementation would call clearinghouse.
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

        if (!canVerifyEligibility(userData.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { policy_id } = body
        if (!policy_id) return NextResponse.json({ error: "Missing policy_id" }, { status: 400 })

        const { data: policy, error: fetchError } = await supabase
            .from("insurance_policies")
            .select("id, clinic_id, patient_id, provider_id")
            .eq("id", policy_id)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (fetchError || !policy) {
            return NextResponse.json({ error: "Policy not found" }, { status: 404 })
        }

        // Stub 271 response: mock benefits. Replace with real 270/271 clearinghouse call.
        const eligibilitySnapshot = {
            verified_at: new Date().toISOString(),
            active: true,
            annual_max: 1500,
            annual_max_remaining: 1200,
            deductible: 50,
            deductible_remaining: 50,
            coverage_percentage: 80,
            plan_type: "PPO",
            waiting_periods: [],
        }

        const { data: updated, error: updateError } = await supabase
            .from("insurance_policies")
            .update({
                eligibility_snapshot: eligibilitySnapshot,
                verification_status: "verified",
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", policy_id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (updateError) throw updateError

        await insertAuditLog(supabase, {
            clinic_id: userData.clinic_id,
            user_id: user.id,
            action: "insurance_eligibility_verified",
            record_type: "insurance_policy",
            record_id: policy_id,
            ip_address: getClientIp(req),
        })

        return NextResponse.json({ eligibility: eligibilitySnapshot, policy: updated })
    } catch (error) {
        console.error("[INSURANCE_VERIFY]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
