import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const { clinicName, adminName } = body as { clinicName?: string; adminName?: string }

        if (!clinicName || typeof clinicName !== "string" || clinicName.trim().length < 2) {
            return NextResponse.json({ error: "Clinic name is required (min 2 characters)" }, { status: 400 })
        }

        // Use the authenticated server client — the RPC is SECURITY DEFINER
        // so it runs with elevated privileges regardless
        const { data, error } = await supabase.rpc("complete_clinic_setup", {
            p_clinic_name: clinicName.trim(),
            p_admin_name: (adminName || user.email || "Admin").trim(),
            p_admin_email: user.email || "",
            p_user_id: user.id,
        })

        if (error) {
            console.error("[complete-setup] RPC error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data?.success) {
            return NextResponse.json({ error: data?.error || "Setup failed" }, { status: 500 })
        }

        return NextResponse.json({ success: true, clinicId: data.clinic_id })
    } catch (error) {
        console.error("[complete-setup]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
