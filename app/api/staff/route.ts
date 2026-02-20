import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const staffId = searchParams.get("id")

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })
        }

        if (staffId) {
            const { data: staff, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", staffId)
                .eq("clinic_id", userData.clinic_id)
                .single()

            if (error) {
                console.error("[STAFF_GET_ID_ERROR]", error)
                return NextResponse.json({ error: "Staff Member Not Found" }, { status: 404 })
            }
            return NextResponse.json(staff)
        }

        const { data: staff, error } = await supabase
            .from("users")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .neq("role", "patient") // Exclude patients if they are in the users table
            .order("first_name", { ascending: true })

        if (error) throw error

        return NextResponse.json(staff)
    } catch (error) {
        console.error("[STAFF_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

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

        if (adminData?.role !== 'clinic_admin' && adminData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { email, first_name, last_name, role, phone } = body

        // For demo/simplicity, we'll create the user in our public.users table.
        // In a production app, you'd use supabase.auth.admin.inviteUserByEmail()
        // but that requires service_role key which shouldn't be in client.

        // We'll generate a random UUID for the "auth" part for now since it's a demo
        // and we want to show it in the UI. In real world, this would be the invited user ID.
        const tempId = crypto.randomUUID()

        const { data: newStaff, error } = await supabase
            .from("users")
            .insert({
                id: tempId,
                clinic_id: adminData.clinic_id,
                email,
                first_name,
                last_name,
                role,
                phone,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error("[STAFF_POST_ERROR]", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(newStaff)
    } catch (error) {
        console.error("[STAFF_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
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

        if (adminData?.role !== 'clinic_admin' && adminData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { id, allowed_sections, limits, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: "Missing Staff ID" }, { status: 400 })
        }

        // Validate allowed_sections if provided
        if (allowed_sections !== undefined && allowed_sections !== null && !Array.isArray(allowed_sections)) {
            return NextResponse.json({ 
                error: "allowed_sections must be an array or null" 
            }, { status: 400 })
        }

        // Validate limits if provided
        if (limits !== undefined && limits !== null && typeof limits !== 'object') {
            return NextResponse.json({ 
                error: "limits must be an object or null" 
            }, { status: 400 })
        }

        // Build update object with all fields
        const updateData: any = { ...updates }
        if (allowed_sections !== undefined) {
            updateData.allowed_sections = allowed_sections
        }
        if (limits !== undefined) {
            updateData.limits = limits
        }

        const { data: updatedStaff, error } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", id)
            .eq("clinic_id", adminData.clinic_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(updatedStaff)
    } catch (error) {
        console.error("[STAFF_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
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

        if (!adminData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        if (adminData.role !== "clinic_admin" && adminData.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const staffId = searchParams.get("id")

        if (!staffId) {
            return NextResponse.json({ error: "Missing Staff ID" }, { status: 400 })
        }

        if (staffId === user.id) {
            return NextResponse.json(
                { error: "You cannot remove yourself. Use a different account to remove your access." },
                { status: 400 },
            )
        }

        // 1. Deactivate staff member in public.users (soft delete) using admin's session + RLS
        const { data: updated, error } = await supabase
            .from("users")
            .update({ is_active: false })
            .eq("id", staffId)
            .eq("clinic_id", adminData.clinic_id)
            .select("id")
            .maybeSingle()

        if (error) {
            console.error("[STAFF_DELETE] update error:", error)
            return NextResponse.json(
                { error: error.message || "Failed to remove staff member", code: error.code },
                { status: 500 },
            )
        }

        if (!updated) {
            return NextResponse.json(
                { error: "Staff member not found or not in your clinic." },
                { status: 404 },
            )
        }

        // 2. Best-effort: delete Supabase Auth user so they cannot log in
        try {
            const adminClient = createAdminClient()
            const { error: authError } = await adminClient.auth.admin.deleteUser(staffId)
            if (authError) {
                const msg = authError.message ?? ""
                const isUserNotFound =
                    msg.toLowerCase().includes("user not found") ||
                    msg.toLowerCase().includes("not found") ||
                    msg.toLowerCase().includes("no user found")
                console.error("[STAFF_DELETE] auth delete error:", authError)
                return NextResponse.json({
                    success: true,
                    warning: isUserNotFound
                        ? "Staff removed from team. This person did not have a login account."
                        : "Staff removed from team. Their login account could not be deleted—they may still be able to sign in. Remove them from Supabase Dashboard → Authentication → Users if needed.",
                })
            }
        } catch (adminError) {
            const err = adminError as Error
            console.error("[STAFF_DELETE] admin client or auth delete error:", err?.message ?? adminError)
            return NextResponse.json({
                success: true,
                warning:
                    "Staff removed from team. Their login could not be removed automatically. They may still sign in until removed from Supabase Dashboard → Authentication → Users. (Check server logs for details.)",
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[STAFF_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
