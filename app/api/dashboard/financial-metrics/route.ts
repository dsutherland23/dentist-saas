import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import {
    calculateARAging,
    calculateCollectionMetrics,
    calculateDaysPastDue,
} from "@/lib/financial-utils"

const UNPAID_STATUSES = ["draft", "sent", "partially_paid", "overdue"]
const BUCKET_ORDER: Array<"current" | "0-30" | "31-60" | "61-90" | "90+"> = [
    "current",
    "0-30",
    "31-60",
    "61-90",
    "90+",
]

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
        const monthStartIso = monthStart.toISOString()

        // 1) Unpaid invoices for AR aging (exclude paid and cancelled)
        const { data: unpaidInvoices, error: unpaidErr } = await supabase
            .from("invoices")
            .select("id, balance_due, due_date, status, total_amount, amount_paid, created_at")
            .eq("clinic_id", clinicId)
            .in("status", UNPAID_STATUSES)

        if (unpaidErr) {
            console.error("[FINANCIAL_METRICS] unpaid invoices:", unpaidErr)
        }

        const invoicesForAging = (unpaidInvoices ?? []).map((inv: any) => ({
            ...inv,
            balance_due: Number(inv.balance_due) ?? 0,
            days_past_due: calculateDaysPastDue(inv.due_date, inv.status ?? ""),
        }))

        const arAgingBucketsRaw = calculateARAging(invoicesForAging)
        const bucketMap = new Map(arAgingBucketsRaw.map((b) => [b.bucket, b]))
        const arAgingBuckets = BUCKET_ORDER.map((key) => bucketMap.get(key) ?? { bucket: key, count: 0, amount: 0 })

        const totalOutstanding = arAgingBuckets.reduce((sum, b) => sum + b.amount, 0)
        const totalInvoicesAging = arAgingBuckets.reduce((sum, b) => sum + b.count, 0)

        // 2) Invoices created this month (for collection metrics: billed)
        const { data: monthInvoices, error: invErr } = await supabase
            .from("invoices")
            .select("id, total_amount, balance_due, status, created_at")
            .eq("clinic_id", clinicId)
            .gte("created_at", monthStartIso)

        if (invErr) {
            console.error("[FINANCIAL_METRICS] month invoices:", invErr)
        }

        // 3) Payments this month (by payment_date)
        const { data: monthPayments, error: payErr } = await supabase
            .from("payments")
            .select("id, amount_paid, payment_method, payment_date, invoice_id")
            .eq("clinic_id", clinicId)
            .gte("payment_date", monthStartIso)

        if (payErr) {
            console.error("[FINANCIAL_METRICS] month payments:", payErr)
        }

        const invoicesList = monthInvoices ?? []
        const paymentsList = monthPayments ?? []

        const collectionMetrics = calculateCollectionMetrics(invoicesList, paymentsList)

        // 4) Payment method breakdown (MTD)
        const paymentMethodBreakdown: Record<string, number> = {}
        for (const p of paymentsList) {
            const method = String(p.payment_method || "other").toLowerCase().replace(/\s+/g, "_")
            paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] ?? 0) + Number(p.amount_paid ?? 0)
        }

        // 5) Average payment turnaround: invoice created -> payment date (for paid invoices)
        let avgPaymentTurnaround = 0
        const paidInvIds = new Set(
            (invoicesList as any[]).filter((inv) => inv.status === "paid").map((inv) => inv.id)
        )
        if (paidInvIds.size > 0) {
            const firstPaymentsByInvoice = new Map<string, { created: number; paymentDate: number }>()
            for (const p of paymentsList as any[]) {
                if (!p.invoice_id || !paidInvIds.has(p.invoice_id)) continue
                const inv = invoicesList.find((i: any) => i.id === p.invoice_id) as any
                if (!inv) continue
                const created = new Date(inv.created_at).getTime()
                const paymentDate = new Date(p.payment_date).getTime()
                const existing = firstPaymentsByInvoice.get(p.invoice_id)
                if (!existing || paymentDate < existing.paymentDate) {
                    firstPaymentsByInvoice.set(p.invoice_id, { created, paymentDate })
                }
            }
            if (firstPaymentsByInvoice.size > 0) {
                const totalDays = Array.from(firstPaymentsByInvoice.values()).reduce(
                    (sum, { created, paymentDate }) =>
                        sum + Math.max(0, Math.floor((paymentDate - created) / (1000 * 60 * 60 * 24))),
                    0
                )
                avgPaymentTurnaround = Math.round(totalDays / firstPaymentsByInvoice.size)
            }
        }

        // 6) Cash flow forecast: next 30 days scheduled appointments, estimate revenue from treatments
        const thirtyDaysFromNow = new Date(now)
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { data: treatments } = await supabase
            .from("treatments")
            .select("id, name, price")
            .eq("clinic_id", clinicId)

        const { data: scheduledAppointments } = await supabase
            .from("appointments")
            .select("id, treatment_type")
            .eq("clinic_id", clinicId)
            .gte("start_time", now.toISOString())
            .lte("start_time", thirtyDaysFromNow.toISOString())
            .in("status", ["scheduled", "confirmed", "pending", "unconfirmed"])

        const treatmentPriceByName: Record<string, number> = {}
        for (const t of treatments ?? []) {
            const name = (t as any).name
            if (name) treatmentPriceByName[name] = Number((t as any).price) || 0
        }

        let forecastRevenue = 0
        for (const apt of scheduledAppointments ?? []) {
            const name = (apt as any).treatment_type
            forecastRevenue += treatmentPriceByName[name] ?? 0
        }

        return NextResponse.json({
            arAging: {
                buckets: arAgingBuckets,
                totalOutstanding: Number(totalOutstanding) || 0,
                totalInvoices: Number(totalInvoicesAging) || 0,
            },
            collectionMetrics: {
                totalBilled: Number(collectionMetrics.totalBilled) ?? 0,
                totalCollected: Number(collectionMetrics.totalCollected) ?? 0,
                collectionRate: Number(collectionMetrics.collectionRate) ?? 0,
                outstandingBalance: Number(collectionMetrics.outstandingBalance) ?? 0,
            },
            paymentMethodBreakdown:
                paymentMethodBreakdown && Object.keys(paymentMethodBreakdown).length > 0
                    ? paymentMethodBreakdown
                    : {},
            avgPaymentTurnaround: Number(avgPaymentTurnaround) || 0,
            cashFlowForecast: {
                next30Days: Number(forecastRevenue) || 0,
                scheduledAppointments: Number(scheduledAppointments?.length) ?? 0,
            },
        })
    } catch (error) {
        console.error("[FINANCIAL_METRICS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
