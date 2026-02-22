import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Eligibility cache cleanup (e.g. daily via Vercel Cron).
 * Optionally clear or mark stale eligibility_snapshot (e.g. older than 90 days).
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
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 90)

        const { data: policies, error } = await supabase
            .from("insurance_policies")
            .select("id")
            .not("verified_at", "is", null)
            .lt("verified_at", cutoff.toISOString())

        if (error) throw error

        let cleared = 0
        for (const p of policies ?? []) {
            const { error: updateError } = await supabase
                .from("insurance_policies")
                .update({
                    eligibility_snapshot: null,
                    verification_status: "stale",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", p.id)
            if (!updateError) cleared++
        }

        return NextResponse.json({ ok: true, cleared })
    } catch (error) {
        console.error("[CRON_ELIGIBILITY_CLEANUP]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
