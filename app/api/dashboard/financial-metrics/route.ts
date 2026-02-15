import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { calculateARAging, calculateCollectionMetrics } from "@/lib/financial-utils"

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
            return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })
        }

        const clinicId = userData.clinic_id
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Fetch AR aging data from view
        const { data: arAgingData } = await supabase
            .from("invoice_ar_aging")
            .select("*")
            .eq("clinic_id", clinicId)

        // Fetch all invoices for collection metrics
        const { data: invoicesData } = await supabase
            .from("invoices")
            .select("*")
            .eq("clinic_id", clinicId)
            .gte("created_at", monthStart.toISOString())

        // Fetch payments for collection rate
        const { data: paymentsData } = await supabase
            .from("payments")
            .select("*")
            .eq("clinic_id", clinicId)
            .gte("payment_date", monthStart.toISOString())

        // Calculate AR aging buckets
        const arAgingBuckets = calculateARAging(arAgingData || [])

        // Calculate collection metrics
        const collectionMetrics = calculateCollectionMetrics(
            invoicesData || [],
            paymentsData || []
        )

        // Payment method breakdown
        const paymentMethodBreakdown = (paymentsData || []).reduce((acc: any, payment: any) => {
            const method = payment.payment_method || 'other'
            acc[method] = (acc[method] || 0) + parseFloat(payment.amount_paid || 0)
            return acc
        }, {})

        // Calculate average payment turnaround
        let avgTurnaround = 0
        if (invoicesData && paymentsData) {
            const paidInvoices = invoicesData.filter(inv => inv.status === 'paid')
            if (paidInvoices.length > 0) {
                const totalDays = paidInvoices.reduce((sum, inv) => {
                    const payment = paymentsData.find(p => p.invoice_id === inv.id)
                    if (payment) {
                        const invoiceDate = new Date(inv.created_at)
                        const paymentDate = new Date(payment.payment_date)
                        const diffTime = paymentDate.getTime() - invoiceDate.getTime()
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                        return sum + Math.max(0, diffDays)
                    }
                    return sum
                }, 0)
                avgTurnaround = Math.round(totalDays / paidInvoices.length)
            }
        }

        // Cash flow forecast (next 30 days based on scheduled appointments)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { data: scheduledAppointments } = await supabase
            .from("appointments")
            .select("*, treatment:treatments(price)")
            .eq("clinic_id", clinicId)
            .gte("start_time", now.toISOString())
            .lte("start_time", thirtyDaysFromNow.toISOString())
            .in("status", ["scheduled", "confirmed"])

        // Estimate forecast revenue from scheduled appointments
        const { data: treatments } = await supabase
            .from("treatments")
            .select("*")
            .eq("clinic_id", clinicId)

        let forecastRevenue = 0
        if (scheduledAppointments && treatments) {
            forecastRevenue = scheduledAppointments.reduce((sum, apt) => {
                const treatment = treatments.find(t => t.name === apt.treatment_type)
                if (treatment) {
                    return sum + parseFloat(treatment.price || 0)
                }
                return sum
            }, 0)
        }

        return NextResponse.json({
            arAging: {
                buckets: arAgingBuckets,
                totalOutstanding: arAgingBuckets.reduce((sum, b) => sum + b.amount, 0),
                totalInvoices: arAgingBuckets.reduce((sum, b) => sum + b.count, 0)
            },
            collectionMetrics,
            paymentMethodBreakdown,
            avgPaymentTurnaround: avgTurnaround,
            cashFlowForecast: {
                next30Days: forecastRevenue,
                scheduledAppointments: scheduledAppointments?.length || 0
            }
        })

    } catch (error) {
        console.error("[FINANCIAL_METRICS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
