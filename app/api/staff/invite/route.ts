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
 * POST /api/staff/invite
 *
 * Create a new staff user with a system-generated temporary password.
 * The admin receives the temp password to share with the staff member.
 * On first login the user is forced to change their password.
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
        const {
            email,
            first_name,
            last_name,
            role,
            phone,
            allowed_sections,
            limits,
        } = body

        if (!email || !role) {
            return NextResponse.json({ error: "Missing required fields: email and role" }, { status: 400 })
        }

        const validRoles = ["dentist", "hygienist", "receptionist", "accountant", "clinic_admin"]
        if (!validRoles.includes(role)) {
            return NextResponse.json({
                error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
            }, { status: 400 })
        }

        if (allowed_sections && !Array.isArray(allowed_sections)) {
            return NextResponse.json({ error: "allowed_sections must be an array" }, { status: 400 })
        }
        if (limits && typeof limits !== "object") {
            return NextResponse.json({ error: "limits must be an object" }, { status: 400 })
        }

        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .eq("clinic_id", adminData.clinic_id)
            .single()

        if (existingUser) {
            return NextResponse.json({
                error: "A user with this email already exists in your clinic",
            }, { status: 409 })
        }

        const adminClient = createAdminClient()
        const tempPassword = generateTempPassword()

        // Create Auth user with temp password (no invite email needed)
        const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                role,
            },
        })

        if (createError) {
            console.error("[INVITE_CREATE_ERROR]", createError)
            return NextResponse.json({
                error: createError.message || "Failed to create user account",
            }, { status: 400 })
        }

        if (!createdUser.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
        }

        // Create user profile in public.users (admin client bypasses RLS)
        const { data: newUser, error: insertError } = await adminClient
            .from("users")
            .insert({
                id: createdUser.user.id,
                clinic_id: adminData.clinic_id,
                email,
                first_name,
                last_name,
                role,
                phone,
                allowed_sections: allowed_sections || null,
                limits: limits || {},
                is_active: true,
                must_change_password: true,
            })
            .select()
            .single()

        if (insertError) {
            console.error("[USER_INSERT_ERROR]", insertError)
            try {
                await adminClient.auth.admin.deleteUser(createdUser.user.id)
            } catch (cleanupError) {
                console.error("[CLEANUP_ERROR]", cleanupError)
            }
            // Return actual DB error so you can see e.g. missing column or constraint
            return NextResponse.json(
                {
                    error: "Failed to create user profile",
                    detail: insertError.message,
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Account created for ${email}. Share the temporary password with the staff member.`,
            user: newUser,
            temp_password: tempPassword,
        })
    } catch (error) {
        console.error("[STAFF_INVITE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
