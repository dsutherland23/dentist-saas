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
            todayAppointmentsResult,
            lastMonthAppointmentsResult,
            lastMonthCompletedAppointmentsResult,
            todayPaymentsResult,
            outstandingInvoicesResult,
            pendingClaimsResult,
            treatmentsResult,
            todayAppointmentsDetailResult,
            mtdAppointmentsDetailResult
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
            })(),

            // Last month appointments
            supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .gte("start_time", lastMonthStart.toISOString())
                .lte("start_time", lastMonthEnd.toISOString()),

            // Last month completed appointments
            supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .eq("status", "completed")
                .gte("start_time", lastMonthStart.toISOString())
                .lte("start_time", lastMonthEnd.toISOString()),

            // Today's payments (collected today)
            (() => {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                return supabase
                    .from("payments")
                    .select("amount_paid")
                    .eq("clinic_id", clinicId)
                    .gte("payment_date", start.toISOString())
                    .lte("payment_date", end.toISOString())
            })(),

            // Outstanding invoices (for AR total)
            supabase
                .from("invoices")
                .select("balance_due")
                .eq("clinic_id", clinicId)
                .not("status", "in", "(paid,cancelled)"),

            // Pending insurance claims
            supabase
                .from("insurance_claims")
                .select("amount_claimed")
                .eq("clinic_id", clinicId)
                .eq("status", "pending"),

            // Treatments for production calculation
            supabase
                .from("treatments")
                .select("*")
                .eq("clinic_id", clinicId),

            // Today's appointments detail (for production)
            (() => {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                return supabase
                    .from("appointments")
                    .select("treatment_type")
                    .eq("clinic_id", clinicId)
                    .in("status", ["scheduled", "confirmed", "checked_in", "in_treatment"])
                    .gte("start_time", start.toISOString())
                    .lte("start_time", end.toISOString())
            })(),

            // MTD appointments detail (for production)
            supabase
                .from("appointments")
                .select("treatment_type")
                .eq("clinic_id", clinicId)
                .in("status", ["scheduled", "confirmed", "checked_in", "in_treatment", "completed"])
                .gte("start_time", monthStart.toISOString())
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

        // Calculate appointment growth
        const lastMonthAppointments = lastMonthAppointmentsResult.count || 0
        const appointmentGrowth = lastMonthAppointments > 0 ? ((totalAppointments - lastMonthAppointments) / lastMonthAppointments * 100) : 0

        // Calculate completion rate change
        const lastMonthCompletedAppointments = lastMonthCompletedAppointmentsResult.count || 0
        const lastMonthCompletionRate = lastMonthAppointments > 0 ? (lastMonthCompletedAppointments / lastMonthAppointments * 100) : 0
        const completionRateChange = completionRate - lastMonthCompletionRate

        // Calculate last 7 days trend for sparklines
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
            const day = new Date(now)
            day.setDate(day.getDate() - i)
            day.setHours(0, 0, 0, 0)
            last7Days.push(day)
        }

        // Fetch revenue trend (last 7 days)
        const revenueTrendPromises = last7Days.map(day => {
            const dayEnd = new Date(day)
            dayEnd.setHours(23, 59, 59, 999)
            return supabase
                .from("invoices")
                .select("total_amount")
                .eq("clinic_id", clinicId)
                .eq("status", "paid")
                .gte("created_at", day.toISOString())
                .lte("created_at", dayEnd.toISOString())
        })

        // Fetch appointment trend (last 7 days)
        const appointmentTrendPromises = last7Days.map(day => {
            const dayEnd = new Date(day)
            dayEnd.setHours(23, 59, 59, 999)
            return supabase
                .from("appointments")
                .select("id", { count: "exact", head: true })
                .eq("clinic_id", clinicId)
                .gte("start_time", day.toISOString())
                .lte("start_time", dayEnd.toISOString())
        })

        const [revenueTrendResults, appointmentTrendResults] = await Promise.all([
            Promise.all(revenueTrendPromises),
            Promise.all(appointmentTrendPromises)
        ])

        const revenueTrend = revenueTrendResults.map(r => 
            r.data?.reduce((sum, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0
        )
        const appointmentTrend = appointmentTrendResults.map(r => r.count || 0)

        // Calculate production values
        const treatments = treatmentsResult.data || []
        const treatmentPriceMap = new Map(
            treatments.map(t => [t.name, parseFloat(t.price || 0)])
        )

        // Today's production
        const todayProduction = (todayAppointmentsDetailResult.data || []).reduce((sum: number, apt: any) => {
            const price = treatmentPriceMap.get(apt.treatment_type) || 0
            return sum + price
        }, 0)

        // MTD production
        const mtdProduction = (mtdAppointmentsDetailResult.data || []).reduce((sum: number, apt: any) => {
            const price = treatmentPriceMap.get(apt.treatment_type) || 0
            return sum + price
        }, 0)

        // Collected today
        const collectedToday = todayPaymentsResult.data?.reduce(
            (sum, pay: any) => sum + parseFloat(pay.amount_paid || 0),
            0
        ) || 0

        // Collection rate (MTD collected / MTD revenue)
        const collectionRate = totalRevenue > 0 ? (totalRevenue / mtdProduction * 100) : 0

        // Outstanding claims
        const outstandingClaims = pendingClaimsResult.data?.reduce(
            (sum, claim: any) => sum + parseFloat(claim.amount_claimed || 0),
            0
        ) || 0
        const outstandingClaimsCount = pendingClaimsResult.data?.length || 0

        // AR total
        const arTotal = outstandingInvoicesResult.data?.reduce(
            (sum, inv: any) => sum + parseFloat(inv.balance_due || 0),
            0
        ) || 0

        return NextResponse.json({
            revenue: {
                total: totalRevenue,
                change: revenueChange,
                changeAmount: totalRevenue - lastMonthRevenue,
                trend: revenueTrend
            },
            production: {
                today: todayProduction,
                mtd: mtdProduction,
                collectedToday: collectedToday,
                collectionRate: collectionRate
            },
            claims: {
                outstanding: outstandingClaims,
                count: outstandingClaimsCount
            },
            arTotal: arTotal,
            patients: {
                total: totalPatients,
                newThisMonth: newPatients
            },
            appointments: {
                total: totalAppointments,
                today: todayAppointments,
                growth: appointmentGrowth,
                lastMonth: lastMonthAppointments,
                trend: appointmentTrend
            },
            completionRate: completionRate,
            completionRateChange: completionRateChange
        })

    } catch (error) {
        console.error("Dashboard stats error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
