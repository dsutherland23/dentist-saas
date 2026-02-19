import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
    const bytes = randomBytes(14)
    let password = ""
    for (let i = 0; i < 14; i++) {
        password += chars[bytes[i] % chars.length]
    }
    return password
}

/**
 * POST /api/staff/reset-password
 *
 * Reset a staff member's password and generate a new temporary password.
 * Admin-only endpoint. Returns the new temp password to share with the staff member.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
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
        const { staff_id } = body

        if (!staff_id) {
            return NextResponse.json({ error: "Missing staff_id" }, { status: 400 })
        }

        // Verify staff belongs to admin's clinic
        const { data: staffData } = await supabase
            .from("users")
            .select("id, email, clinic_id")
            .eq("id", staff_id)
            .eq("clinic_id", adminData.clinic_id)
            .single()

        if (!staffData) {
            return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
        }

        const adminClient = createAdminClient()
        const newTempPassword = generateTempPassword()

        // Update the Auth user's password (staff_id must exist in auth.users)
        const { error: updateError } = await adminClient.auth.admin.updateUserById(staff_id, {
            password: newTempPassword,
        })

        if (updateError) {
            console.error("[RESET_PASSWORD_ERROR]", updateError)
            const msg = updateError.message ?? ""
            const isAuthUserNotFound =
                msg.toLowerCase().includes("user not found") ||
                msg.toLowerCase().includes("not found") ||
                msg.toLowerCase().includes("no user found")
            if (isAuthUserNotFound) {
                return NextResponse.json({
                    error: "This team member doesn't have a login account. They may have been added from demo data or outside the app. Remove them from the team and use Settings → Team → Invite Member to create a proper account with email and password.",
                    code: "auth_user_not_found",
                }, { status: 404 })
            }
            return NextResponse.json({
                error: updateError.message || "Failed to reset password",
            }, { status: 400 })
        }

        // Set must_change_password flag
        const { error: flagError } = await adminClient
            .from("users")
            .update({ must_change_password: true })
            .eq("id", staff_id)

        if (flagError) {
            console.error("[RESET_PASSWORD_FLAG_ERROR]", flagError)
        }

        return NextResponse.json({
            success: true,
            message: `Password reset for ${staffData.email}. Share the new temporary password.`,
            email: staffData.email,
            temp_password: newTempPassword,
        })
    } catch (error) {
        console.error("[RESET_PASSWORD]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
