import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/auth/complete-first-login
 *
 * Clear the must_change_password flag and optionally update display name.
 * Called from the set-password page after the client updates the Auth password.
 */
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { first_name, last_name } = body

        const updates: Record<string, unknown> = {
            must_change_password: false,
            password_changed_at: new Date().toISOString(),
        }

        if (first_name !== undefined && first_name !== "") {
            updates.first_name = first_name
        }
        if (last_name !== undefined && last_name !== "") {
            updates.last_name = last_name
        }

        const { error: updateError } = await supabase
            .from("users")
            .update(updates)
            .eq("id", user.id)

        if (updateError) {
            console.error("[COMPLETE_FIRST_LOGIN]", updateError)
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[COMPLETE_FIRST_LOGIN]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
