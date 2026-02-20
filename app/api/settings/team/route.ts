import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

const ADMIN_ROLES = ["clinic_admin", "super_admin"] as const
const VALID_ROLES = ["super_admin", "clinic_admin", "dentist", "hygienist", "receptionist", "accountant"] as const

function isAdmin(role: string | undefined): role is (typeof ADMIN_ROLES)[number] {
    return role != null && ADMIN_ROLES.includes(role as any)
}

// GET team members (and whether current user can manage team)
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const { data: team, error } = await supabase
            .from("users")
            .select("id, email, first_name, last_name, role, is_active, created_at")
            .eq("clinic_id", userData.clinic_id)
            .neq("role", "patient")
            .order("first_name", { ascending: true })

        if (error) {
            return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
        }

        return NextResponse.json({
            team: team ?? [],
            canManageTeam: isAdmin(userData.role),
        })
    } catch (error) {
        console.error("Team GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST invite: redirect to staff invite API (use POST /api/staff/invite from the UI)
export async function POST() {
    return NextResponse.json(
        { error: "Use POST /api/staff/invite to invite team members with email, name, and role." },
        { status: 400 }
    )
}

// PUT update member role (uses admin client so RLS cannot block after we've verified admin)
export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }
        if (!isAdmin(userData.role)) {
            return NextResponse.json({ error: "Insufficient permissions. Only clinic admins can change roles." }, { status: 403 })
        }

        const body = await request.json()
        const { userId, role } = body
        if (!userId || !role) {
            return NextResponse.json({ error: "Missing userId or role" }, { status: 400 })
        }
        if (!VALID_ROLES.includes(role as any)) {
            return NextResponse.json({
                error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
            }, { status: 400 })
        }

        // Prevent demoting the last clinic admin (clinic must always have at least one admin)
        const isDemotingToNonAdmin = role !== "clinic_admin" && role !== "super_admin"
        if (isDemotingToNonAdmin) {
            const { data: targetUser } = await supabase
                .from("users")
                .select("role")
                .eq("id", userId)
                .eq("clinic_id", userData.clinic_id)
                .single()
            if (targetUser && isAdmin(targetUser.role)) {
                const { count } = await supabase
                    .from("users")
                    .select("id", { count: "exact", head: true })
                    .eq("clinic_id", userData.clinic_id)
                    .neq("role", "patient")
                    .in("role", ["clinic_admin", "super_admin"])
                    .or("is_active.is.null,is_active.eq.true")
                if (count !== null && count <= 1) {
                    return NextResponse.json(
                        { error: "Cannot change role: the clinic must have at least one admin. Add another admin first, or promote someone else to Admin." },
                        { status: 400 }
                    )
                }
            }
        }

        const admin = createAdminClient()
        const { error } = await admin
            .from("users")
            .update({ role })
            .eq("id", userId)
            .eq("clinic_id", userData.clinic_id)

        if (error) {
            console.error("[Team PUT] role update error:", error)
            return NextResponse.json(
                { error: error.message || "Failed to update role" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Team PUT error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE remove/deactivate a team member (admin only; sets is_active = false to preserve history)
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }
        if (!isAdmin(userData.role)) {
            return NextResponse.json({ error: "Insufficient permissions. Only clinic admins can remove team members." }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId")
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 })
        }

        if (userId === user.id) {
            return NextResponse.json({ error: "You cannot remove yourself. Use a different account to remove your access." }, { status: 400 })
        }

        // 1. Deactivate in public.users using the requester's session (RLS allows admins to update users in their clinic)
        const { data: updated, error } = await supabase
            .from("users")
            .update({ is_active: false })
            .eq("id", userId)
            .eq("clinic_id", userData.clinic_id)
            .select("id")
            .maybeSingle()

        if (error) {
            console.error("[Team DELETE] update error:", error)
            return NextResponse.json({
                error: error.message || "Failed to remove member",
                code: error.code,
            }, { status: 500 })
        }

        if (!updated) {
            return NextResponse.json({
                error: "Staff member not found or not in your clinic.",
            }, { status: 404 })
        }

        // 2. Delete from Supabase Auth so they cannot log in (best-effort; requires service role)
        try {
            const admin = createAdminClient()
            const { error: authError } = await admin.auth.admin.deleteUser(userId)
            if (authError) {
                const msg = authError.message ?? ""
                const isUserNotFound =
                    msg.toLowerCase().includes("user not found") ||
                    msg.toLowerCase().includes("not found") ||
                    msg.toLowerCase().includes("no user found")
                console.error("[Team DELETE] auth delete error:", authError)
                return NextResponse.json({
                    success: true,
                    warning: isUserNotFound
                        ? "Staff removed from team. This person did not have a login account."
                        : "Staff removed from team. Their login account could not be deleted—they may still be able to sign in. Remove them from Supabase Dashboard → Authentication → Users if needed.",
                })
            }
        } catch (adminError) {
            console.error("[Team DELETE] admin client or auth delete error:", adminError)
            return NextResponse.json({
                success: true,
                warning: "Staff removed from team. Their login could not be removed (check SUPABASE_SERVICE_ROLE_KEY). They may still sign in until removed from Supabase Dashboard → Authentication → Users.",
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Team DELETE error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
