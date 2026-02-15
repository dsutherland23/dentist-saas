import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { calculateARAging, calculateCollectionMetrics, calculateDaysPastDue } from "@/lib/financial-utils"

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

        // Fetch AR aging data from view (fallback to invoices if view missing)
        const { data: arAgingData, error: arError } = await supabase
            .from("invoice_ar_aging")
            .select("*")
            .eq("clinic_id", clinicId)

        let arAgingRows = arAgingData || []
        if (arError) {
            const { data: invData } = await supabase
                .from("invoices")
                .select("id, clinic_id, balance_due, due_date, status")
                .eq("clinic_id", clinicId)
                .not("status", "in", "('paid','cancelled')")
            arAgingRows = (invData || []).map((inv: any) => ({
                ...inv,
                days_past_due: calculateDaysPastDue(inv.due_date, inv.status),
            }))
        }

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
        const arAgingBuckets = calculateARAging(arAgingRows)

        // Calculate collection metrics
        const collectionMetrics = calculateCollectionMetrics(
            invoicesData || [],
            paymentsData || []
        )

        // Payment method breakdown (always return a plain object)
        const paymentMethodBreakdown = (paymentsData || []).reduce((acc: Record<string, number>, payment: any) => {
            const method = String(payment.payment_method || "other").toLowerCase()
            acc[method] = (acc[method] || 0) + parseFloat(payment.amount_paid || 0)
            return acc
        }, {} as Record<string, number>)

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

        const totalOutstanding = arAgingBuckets.reduce((sum, b) => sum + b.amount, 0)
        const totalInvoices = arAgingBuckets.reduce((sum, b) => sum + b.count, 0)
        return NextResponse.json({
            arAging: {
                buckets: arAgingBuckets,
                totalOutstanding: Number(totalOutstanding) || 0,
                totalInvoices: Number(totalInvoices) || 0,
            },
            collectionMetrics: {
                totalBilled: Number(collectionMetrics.totalBilled) ?? 0,
                totalCollected: Number(collectionMetrics.totalCollected) ?? 0,
                collectionRate: Number(collectionMetrics.collectionRate) ?? 0,
                outstandingBalance: Number(collectionMetrics.outstandingBalance) ?? 0,
            },
            paymentMethodBreakdown: paymentMethodBreakdown && typeof paymentMethodBreakdown === "object" ? paymentMethodBreakdown : {},
            avgPaymentTurnaround: Number(avgTurnaround) || 0,
            cashFlowForecast: {
                next30Days: Number(forecastRevenue) || 0,
                scheduledAppointments: Number(scheduledAppointments?.length) || 0,
            },
        })

    } catch (error) {
        console.error("[FINANCIAL_METRICS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
