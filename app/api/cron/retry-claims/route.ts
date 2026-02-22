import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Retry failed/pending claims (e.g. every 30 min via Vercel Cron).
 * Lists claims with status submitted or pending older than threshold; in a full impl would re-send 837D.
 * Secured by CRON_SECRET in Authorization header.
 */
export async function GET(req: Request) {
    if (CRON_SECRET) {
        const auth = req.headers.get("authorization")
        const token = auth?.replace(/^Bearer\s+/i, "")
        if (token !== CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
    }

    try {
        const supabase = await createClient()
        const threshold = new Date()
        threshold.setHours(threshold.getHours() - 24)

        const { data: claims, error } = await supabase
            .from("claims")
            .select("id, clinic_id, claim_number, status, submitted_at")
            .in("status", ["pending", "submitted"])
            .lt("submitted_at", threshold.toISOString())

        if (error) throw error

        const count = claims?.length ?? 0
        for (const claim of claims ?? []) {
            // Stub: in production, call clearinghouse retry and update claim
            await supabase
                .from("claims")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", claim.id)
        }

        return NextResponse.json({ ok: true, retried: count })
    } catch (error) {
        console.error("[CRON_RETRY_CLAIMS]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
