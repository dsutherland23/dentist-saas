import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay } from "date-fns"

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
            return NextResponse.json({ error: "Clinic not found. Please complete onboarding." }, { status: 404 })
        }

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
        const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))

        // 1. Current Month Invoices
        const { data: currentInvoices } = await supabase
            .from("invoices")
            .select("total_amount, issue_date, status")
            .eq("clinic_id", userData.clinic_id)
            .gte("issue_date", monthStart.toISOString())
            .lte("issue_date", monthEnd.toISOString())

        // 2. Previous Month Invoices for Growth
        const { data: prevInvoices } = await supabase
            .from("invoices")
            .select("total_amount")
            .eq("clinic_id", userData.clinic_id)
            .gte("issue_date", prevMonthStart.toISOString())
            .lte("issue_date", prevMonthEnd.toISOString())

        // 3. Revenue Trends
        const days = eachDayOfInterval({ start: monthStart, end: now })
        const revenueData = days.map(day => {
            const dateStr = format(day, "MMM dd")
            const amount = currentInvoices?.filter(inv => format(new Date(inv.issue_date), "MMM dd") === dateStr)
                .reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0
            return { name: dateStr, value: amount }
        })

        // 4. Treatment Analytics
        const { data: appointments } = await supabase
            .from("appointments")
            .select("treatment_type, id, dentist_id")
            .eq("clinic_id", userData.clinic_id)

        const treatmentDistribution = appointments?.reduce((acc: any[], curr) => {
            const existing = acc.find(a => a.name === curr.treatment_type)
            if (existing) {
                existing.value++
            } else {
                acc.push({ name: curr.treatment_type || "General", value: 1 })
            }
            return acc
        }, []) || []

        // 5. Patient Stats
        const { count: totalPatients } = await supabase
            .from("patients")
            .select("*", { count: 'exact', head: true })
            .eq("clinic_id", userData.clinic_id)

        const { count: newPatients } = await supabase
            .from("patients")
            .select("*", { count: 'exact', head: true })
            .eq("clinic_id", userData.clinic_id)
            .gte("created_at", monthStart.toISOString())

        // 6. Calculations
        const currentRevenue = currentInvoices?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0
        const prevRevenue = prevInvoices?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0
        const revenueGrowth = prevRevenue === 0 ? 100 : Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)

        const { data: staff } = await supabase
            .from("users")
            .select("id, first_name, last_name")
            .eq("clinic_id", userData.clinic_id)
            .in("role", ["dentist", "hygienist"])

        const staffPerformance = staff?.map(s => {
            const count = appointments?.filter(a => a.dentist_id === s.id).length || 0
            return {
                name: `${s.first_name} ${s.last_name}`,
                appointments: count
            }
        }).sort((a, b) => b.appointments - a.appointments) || []

        return NextResponse.json({
            revenueData,
            treatmentDistribution: treatmentDistribution.sort((a, b) => b.value - a.value).slice(0, 5),
            metrics: {
                totalRevenue: currentRevenue,
                revenueGrowth,
                appointmentCount: appointments?.length || 0,
                patientCount: totalPatients || 0,
                newPatients: newPatients || 0,
                patientGrowth: totalPatients && newPatients ? Math.round((newPatients / (totalPatients - newPatients)) * 100) : 0
            },
            staffPerformance
        })
    } catch (error) {
        console.error("[REPORTS_STATS_GET]", error)
        return NextResponse.json({ error: "Failed to load report data" }, { status: 500 })
    }
}
