import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { data: adminData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!adminData?.clinic_id) {
            return new NextResponse("Clinic Not Found", { status: 404 })
        }

        // Fetch recent audit logs for the clinic
        const { data: activity, error } = await supabase
            .from("team_planner_audit_log")
            .select(`
                *,
                actor:changed_by(first_name, last_name)
            `)
            .eq("clinic_id", adminData.clinic_id)
            .order("created_at", { ascending: false })
            .limit(10)

        if (error) throw error

        return NextResponse.json(activity)
    } catch (error) {
        console.error("[STAFF_ACTIVITY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
