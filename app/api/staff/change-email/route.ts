import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

/**
 * POST /api/staff/change-email
 *
 * Change a staff member's email. Admin-only.
 * Updates both Supabase Auth and public.users. No email confirmation required when using admin API.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: adminData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!adminData) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }

        if (adminData.role !== "clinic_admin" && adminData.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
        }

        const body = await request.json()
        const { staff_id, new_email } = body

        if (!staff_id || !new_email) {
            return NextResponse.json({ error: "Missing staff_id or new_email" }, { status: 400 })
        }

        const trimmedEmail = String(new_email).trim().toLowerCase()
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
        }

        const { data: staffData } = await supabase
            .from("users")
            .select("id, email, clinic_id")
            .eq("id", staff_id)
            .eq("clinic_id", adminData.clinic_id)
            .single()

        if (!staffData) {
            return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
        }

        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("clinic_id", adminData.clinic_id)
            .eq("email", trimmedEmail)
            .single()

        if (existing && existing.id !== staff_id) {
            return NextResponse.json({
                error: "Another user in your clinic already has this email",
            }, { status: 409 })
        }

        const adminClient = createAdminClient()

        const { error: authError } = await adminClient.auth.admin.updateUserById(staff_id, {
            email: trimmedEmail,
        })

        if (authError) {
            console.error("[CHANGE_EMAIL_AUTH]", authError)
            return NextResponse.json({
                error: authError.message || "Failed to update email",
            }, { status: 400 })
        }

        const { error: dbError } = await adminClient
            .from("users")
            .update({ email: trimmedEmail })
            .eq("id", staff_id)

        if (dbError) {
            console.error("[CHANGE_EMAIL_DB]", dbError)
            return NextResponse.json({ error: "Failed to update profile email" }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Email updated to ${trimmedEmail}. Share with the staff member.`,
            email: trimmedEmail,
        })
    } catch (error) {
        console.error("[STAFF_CHANGE_EMAIL]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
