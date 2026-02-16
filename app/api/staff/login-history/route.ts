import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * GET /api/staff/login-history
 *
 * Returns login history for all staff in the admin's clinic.
 * Admin-only endpoint (clinic_admin or super_admin).
 *
 * Query params:
 *   ?user_id=<uuid>   - optional, filter to a specific user
 *   ?limit=<number>    - optional, default 100
 */
export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url)
        const userIdFilter = searchParams.get("user_id")
        const limitParam = parseInt(searchParams.get("limit") || "100", 10)
        const limit = Math.min(Math.max(1, limitParam), 500)

        // Fetch staff members
        const { data: staffMembers, error: staffError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role, is_active")
            .eq("clinic_id", adminData.clinic_id)
            .not("role", "eq", "patient")

        if (staffError) {
            console.error("[LOGIN_HISTORY_STAFF]", staffError)
            return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
        }

        // Build login log query
        let logQuery = supabase
            .from("user_login_log")
            .select("id, user_id, logged_at, ip_address, user_agent")
            .eq("clinic_id", adminData.clinic_id)
            .order("logged_at", { ascending: false })
            .limit(limit)

        if (userIdFilter) {
            logQuery = logQuery.eq("user_id", userIdFilter)
        }

        const { data: loginLogs, error: logError } = await logQuery

        if (logError) {
            console.error("[LOGIN_HISTORY_LOGS]", logError)
            return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 })
        }

        // Aggregate stats per staff
        const staffMap = new Map<string, {
            id: string
            first_name: string
            last_name: string
            email: string
            role: string
            is_active: boolean
            login_count: number
            last_login: string | null
            recent_logins: Array<{ logged_at: string; ip_address: string | null; user_agent: string | null }>
        }>()

        for (const s of staffMembers || []) {
            staffMap.set(s.id, {
                id: s.id,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                role: s.role,
                is_active: s.is_active,
                login_count: 0,
                last_login: null,
                recent_logins: [],
            })
        }

        for (const log of loginLogs || []) {
            const entry = staffMap.get(log.user_id)
            if (!entry) continue
            entry.login_count += 1
            if (!entry.last_login || log.logged_at > entry.last_login) {
                entry.last_login = log.logged_at
            }
            if (entry.recent_logins.length < 10) {
                entry.recent_logins.push({
                    logged_at: log.logged_at,
                    ip_address: log.ip_address,
                    user_agent: log.user_agent,
                })
            }
        }

        const staffWithHistory = Array.from(staffMap.values())
            .sort((a, b) => {
                if (a.last_login && b.last_login) return b.last_login.localeCompare(a.last_login)
                if (a.last_login) return -1
                if (b.last_login) return 1
                return (a.first_name || "").localeCompare(b.first_name || "")
            })

        return NextResponse.json({
            staff: staffWithHistory,
            total_logs: (loginLogs || []).length,
        })
    } catch (error) {
        console.error("[LOGIN_HISTORY]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
