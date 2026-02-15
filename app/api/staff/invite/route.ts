import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

/**
 * POST /api/staff/invite
 * 
 * Invite a new user with Supabase Auth and create their profile.
 * This uses the service role to create an Auth user and send an invite email.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const { data: adminData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!adminData) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }

        if (adminData.role !== 'clinic_admin' && adminData.role !== 'super_admin') {
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
            limits 
        } = body

        // Validate required fields
        if (!email || !role) {
            return NextResponse.json({ 
                error: "Missing required fields: email and role" 
            }, { status: 400 })
        }

        // Validate role
        const validRoles = ['dentist', 'hygienist', 'receptionist', 'accountant', 'clinic_admin']
        if (!validRoles.includes(role)) {
            return NextResponse.json({ 
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            }, { status: 400 })
        }

        // Validate allowed_sections if provided
        if (allowed_sections && !Array.isArray(allowed_sections)) {
            return NextResponse.json({ 
                error: "allowed_sections must be an array" 
            }, { status: 400 })
        }

        // Validate limits if provided
        if (limits && typeof limits !== 'object') {
            return NextResponse.json({ 
                error: "limits must be an object" 
            }, { status: 400 })
        }

        // Check if user with this email already exists in this clinic
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .eq("clinic_id", adminData.clinic_id)
            .single()

        if (existingUser) {
            return NextResponse.json({ 
                error: "A user with this email already exists in your clinic" 
            }, { status: 409 })
        }

        // Create admin client with service role
        const adminClient = createAdminClient()

        // Get the origin for redirect URL
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        // Invite user via Supabase Auth
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    first_name,
                    last_name,
                    role,
                },
                redirectTo: `${origin}/auth/callback`
            }
        )

        if (inviteError) {
            console.error("[INVITE_ERROR]", inviteError)
            return NextResponse.json({ 
                error: inviteError.message || "Failed to send invitation" 
            }, { status: 400 })
        }

        if (!inviteData.user) {
            return NextResponse.json({ 
                error: "Failed to create user" 
            }, { status: 500 })
        }

        // Create user profile in public.users
        const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
                id: inviteData.user.id,
                clinic_id: adminData.clinic_id,
                email,
                first_name,
                last_name,
                role,
                phone,
                allowed_sections: allowed_sections || null,
                limits: limits || {},
                is_active: true
            })
            .select()
            .single()

        if (insertError) {
            console.error("[USER_INSERT_ERROR]", insertError)
            // Try to clean up the auth user if profile creation fails
            try {
                await adminClient.auth.admin.deleteUser(inviteData.user.id)
            } catch (cleanupError) {
                console.error("[CLEANUP_ERROR]", cleanupError)
            }
            return NextResponse.json({ 
                error: "Failed to create user profile" 
            }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true,
            message: `Invitation sent to ${email}. They will receive an email to set their password.`,
            user: newUser
        })

    } catch (error) {
        console.error("[STAFF_INVITE]", error)
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 })
    }
}
