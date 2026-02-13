import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET team members
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const { data: team, error } = await supabase
            .from("users")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .neq("role", "patient")
            .order("first_name", { ascending: true })

        if (error) {
            return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
        }

        return NextResponse.json(team)

    } catch (error) {
        console.error("Team GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST invite team member (Simulated for now, would typically involve sending an email)
export async function POST(request: Request) {
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

        if (userData?.role !== 'clinic_admin' && userData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const { email, role, first_name, last_name } = await request.json()

        // In a real app, we would use supabase.auth.admin.inviteUserByEmail
        // For this demo, let's just return success
        return NextResponse.json({ success: true, message: `Invite sent to ${email}` })

    } catch (error) {
        console.error("Team POST error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT update member role
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

        if (userData?.role !== 'clinic_admin' && userData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const { userId, role } = await request.json()

        const { error } = await supabase
            .from("users")
            .update({ role })
            .eq("id", userId)
            .eq("clinic_id", userData.clinic_id)

        if (error) {
            return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Team PUT error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
