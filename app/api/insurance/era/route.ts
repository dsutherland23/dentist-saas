import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { insertAuditLog, getClientIp } from "@/lib/audit-log"

const ERA_WEBHOOK_SECRET = process.env.ERA_WEBHOOK_SECRET || ""

/**
 * POST /api/insurance/era
 * Receive 835 ERA from clearinghouse. Auth: Webhook secret (header or body).
 * Parse payload, match to claim, insert era_payments, update claim status.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const authHeader = req.headers.get("authorization")
        const secret = authHeader?.replace(/^Bearer\s+/i, "") || body?.secret
        if (ERA_WEBHOOK_SECRET && secret !== ERA_WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { claim_id, payment_amount = 0, adjustment_amount = 0 } = body

        if (!claim_id) {
            return NextResponse.json({ error: "Missing claim_id" }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: claim, error: claimError } = await supabase
            .from("claims")
            .select("id, clinic_id, status")
            .eq("id", claim_id)
            .single()

        if (claimError || !claim) {
            return NextResponse.json({ error: "Claim not found" }, { status: 404 })
        }

        const { data: payment, error: payError } = await supabase
            .from("era_payments")
            .insert({
                claim_id: claim.id,
                payment_amount: Number(payment_amount),
                adjustment_amount: Number(adjustment_amount),
            })
            .select()
            .single()

        if (payError) throw payError

        await supabase
            .from("claims")
            .update({
                status: Number(payment_amount) > 0 ? "paid" : claim.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", claim_id)

        await insertAuditLog(supabase, {
            clinic_id: claim.clinic_id,
            user_id: null,
            action: "era_payment_posted",
            record_type: "era_payment",
            record_id: payment.id,
            ip_address: getClientIp(req),
        })

        return NextResponse.json({ ok: true, payment })
    } catch (error) {
        console.error("[INSURANCE_ERA]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
