import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's clinic
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const clinicId = userData.clinic_id

        // Get current month start and end
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        // Parallel fetch all stats
        const [
            totalRevenueResult,
            lastMonthRevenueResult,
            patientsResult,
            lastMonthPatientsResult,
            appointmentsResult,
            completedAppointmentsResult,
            todayAppointmentsResult
        ] = await Promise.all([
            // Total revenue this month
            supabase
                .from("invoices")
                .select("total_amount")
                .eq("clinic_id", clinicId)
                .eq("status", "paid")
                .gte("created_at", monthStart.toISOString()),

            // Last month revenue
            supabase
                .from("invoices")
                .select("total_amount")
                .eq("clinic_id", clinicId)
                .eq("status", "paid")
                .gte("created_at", lastMonthStart.toISOString())
                .lte("created_at", lastMonthEnd.toISOString()),

            // Active patients count
            supabase
                .from("patients")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId),

            // New patients this month
            supabase
                .from("patients")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .gte("created_at", monthStart.toISOString()),

            // Total appointments this month
            supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .gte("start_time", monthStart.toISOString()),

            // Completed appointments this month
            supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .eq("status", "completed")
                .gte("start_time", monthStart.toISOString()),

            // Today's appointments (use explicit date range; do not mutate now)
            (() => {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                return supabase
                    .from("appointments")
                    .select("id", { count: "exact", head: true })
                    .eq("clinic_id", clinicId)
                    .gte("start_time", start.toISOString())
                    .lte("start_time", end.toISOString())
            })()
        ])

        // Calculate totals
        const totalRevenue = totalRevenueResult.data?.reduce((sum, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0
        const lastMonthRevenue = lastMonthRevenueResult.data?.reduce((sum, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0
        const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0

        const totalPatients = patientsResult.count || 0
        const newPatients = lastMonthPatientsResult.count || 0

        const totalAppointments = appointmentsResult.count || 0
        const completedAppointments = completedAppointmentsResult.count || 0
        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments * 100) : 0

        const todayAppointments = todayAppointmentsResult.count || 0

        return NextResponse.json({
            revenue: {
                total: totalRevenue,
                change: revenueChange,
                changeAmount: totalRevenue - lastMonthRevenue
            },
            patients: {
                total: totalPatients,
                newThisMonth: newPatients
            },
            appointments: {
                total: totalAppointments,
                today: todayAppointments
            },
            completionRate: completionRate
        })

    } catch (error) {
        console.error("Dashboard stats error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
