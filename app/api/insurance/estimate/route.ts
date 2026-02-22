import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { estimateInsurance } from "@/lib/insurance-estimator"
import { canViewEstimator } from "@/lib/insurance-permissions"

/**
 * POST /api/insurance/estimate
 * Body: procedure_fee, coverage_percentage, deductible_remaining, annual_max_remaining
 * Optional: policy_id to pull from eligibility_snapshot; or procedure_code.
 * Restrict to roles with view_estimator: dentist, receptionist, clinic_admin, super_admin.
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

        if (!canViewEstimator(userData.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        let procedure_fee = body.procedure_fee
        let coverage_percentage = body.coverage_percentage
        let deductible_remaining = body.deductible_remaining
        let annual_max_remaining = body.annual_max_remaining

        if (body.policy_id) {
            const { data: policy } = await supabase
                .from("insurance_policies")
                .select("eligibility_snapshot")
                .eq("id", body.policy_id)
                .eq("clinic_id", userData.clinic_id)
                .single()
            const snap = policy?.eligibility_snapshot as Record<string, unknown> | null
            if (snap) {
                if (coverage_percentage == null && snap.coverage_percentage != null) {
                    coverage_percentage = snap.coverage_percentage
                }
                if (deductible_remaining == null && snap.deductible_remaining != null) {
                    deductible_remaining = snap.deductible_remaining
                }
                if (annual_max_remaining == null && snap.annual_max_remaining != null) {
                    annual_max_remaining = snap.annual_max_remaining
                }
            }
        }

        const fee = Number(procedure_fee) || 0
        const pct = Number(coverage_percentage) ?? 80
        const deduct = Number(deductible_remaining) ?? 0
        const maxRem = annual_max_remaining != null ? Number(annual_max_remaining) : Infinity

        const result = estimateInsurance({
            procedure_code: body.procedure_code,
            procedure_fee: fee,
            coverage_percentage: pct,
            deductible_remaining: deduct,
            annual_max_remaining: maxRem,
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("[INSURANCE_ESTIMATE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
