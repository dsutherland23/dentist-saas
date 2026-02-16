import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * POST /api/auth/log-login
 *
 * Record a login event for the authenticated user.
 * Called from the client after a successful signInWithPassword.
 */
export async function POST(request: Request) {
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
            return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }

        const ip = request.headers.get("x-forwarded-for")
            || request.headers.get("x-real-ip")
            || "unknown"
        const userAgent = request.headers.get("user-agent") || "unknown"

        const { error: insertError } = await supabase
            .from("user_login_log")
            .insert({
                user_id: user.id,
                clinic_id: userData.clinic_id,
                ip_address: ip,
                user_agent: userAgent,
            })

        if (insertError) {
            console.error("[LOG_LOGIN_INSERT]", insertError)
            return NextResponse.json({ error: "Failed to record login" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[LOG_LOGIN]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
