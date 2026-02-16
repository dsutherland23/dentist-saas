import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

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

        // Parallel fetch claims data
        const [
            claimsThisMonthResult,
            pendingClaimsResult,
            deniedClaimsResult,
            paidClaimsResult,
            allClaimsResult
        ] = await Promise.all([
            // Claims submitted this month
            supabase
                .from("insurance_claims")
                .select("amount_claimed", { count: "exact" })
                .eq("clinic_id", clinicId)
                .gte("submitted_at", monthStart.toISOString()),

            // Claims pending > 14 days
            supabase
                .from("insurance_claims")
                .select("amount_claimed, submitted_at")
                .eq("clinic_id", clinicId)
                .eq("status", "pending"),

            // Denied claims
            supabase
                .from("insurance_claims")
                .select("amount_claimed", { count: "exact" })
                .eq("clinic_id", clinicId)
                .eq("status", "rejected")
                .gte("submitted_at", monthStart.toISOString()),

            // Paid claims for average days calculation
            supabase
                .from("insurance_claims")
                .select("submitted_at, updated_at")
                .eq("clinic_id", clinicId)
                .eq("status", "paid")
                .gte("submitted_at", monthStart.toISOString()),

            // All claims for totals
            supabase
                .from("insurance_claims")
                .select("amount_claimed, status")
                .eq("clinic_id", clinicId)
        ])

        // Calculate claims submitted this month
        const claimsSubmitted = claimsThisMonthResult.count || 0
        const claimsSubmittedValue = claimsThisMonthResult.data?.reduce(
            (sum, c: any) => sum + parseFloat(c.amount_claimed || 0),
            0
        ) || 0

        // Calculate claims pending > 14 days
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const claimsPending14Plus = pendingClaimsResult.data?.filter((c: any) => {
            const submitted = new Date(c.submitted_at)
            return submitted < fourteenDaysAgo
        }) || []

        const claimsPending14PlusCount = claimsPending14Plus.length
        const claimsPending14PlusValue = claimsPending14Plus.reduce(
            (sum: number, c: any) => sum + parseFloat(c.amount_claimed || 0),
            0
        )

        // Calculate denied claims
        const deniedClaimsCount = deniedClaimsResult.count || 0
        const deniedClaimsValue = deniedClaimsResult.data?.reduce(
            (sum, c: any) => sum + parseFloat(c.amount_claimed || 0),
            0
        ) || 0

        // Calculate average days to payment
        let avgDaysToPayment = 0
        if (paidClaimsResult.data && paidClaimsResult.data.length > 0) {
            const totalDays = paidClaimsResult.data.reduce((sum: number, c: any) => {
                const submitted = new Date(c.submitted_at)
                const paid = new Date(c.updated_at)
                const diffTime = paid.getTime() - submitted.getTime()
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                return sum + diffDays
            }, 0)
            avgDaysToPayment = Math.round(totalDays / paidClaimsResult.data.length)
        }

        // Calculate expected vs actual
        const totalClaimed = allClaimsResult.data?.reduce(
            (sum, c: any) => sum + parseFloat(c.amount_claimed || 0),
            0
        ) || 0

        const totalPaidAmount = allClaimsResult.data
            ?.filter((c: any) => c.status === 'paid')
            .reduce((sum, c: any) => sum + parseFloat(c.amount_claimed || 0), 0) || 0

        // Alert indicators
        const alerts = []

        // Claims near filing deadline (pending > 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const claimsNearDeadline = pendingClaimsResult.data?.filter((c: any) => {
            const submitted = new Date(c.submitted_at)
            return submitted < thirtyDaysAgo
        }).length || 0

        if (claimsNearDeadline > 0) {
            alerts.push({
                type: 'deadline',
                severity: 'high',
                message: `${claimsNearDeadline} claims pending over 30 days`,
                count: claimsNearDeadline
            })
        }

        if (deniedClaimsCount > 0) {
            alerts.push({
                type: 'rejected',
                severity: 'high',
                message: `${deniedClaimsCount} claims rejected this month`,
                count: deniedClaimsCount
            })
        }

        if (claimsPending14PlusCount > 0) {
            alerts.push({
                type: 'pending',
                severity: 'medium',
                message: `${claimsPending14PlusCount} claims pending over 14 days`,
                count: claimsPending14PlusCount
            })
        }

        return NextResponse.json({
            claimsSubmitted: {
                count: claimsSubmitted,
                value: claimsSubmittedValue
            },
            claimsPending14Plus: {
                count: claimsPending14PlusCount,
                value: claimsPending14PlusValue
            },
            deniedClaims: {
                count: deniedClaimsCount,
                value: deniedClaimsValue
            },
            avgDaysToPayment,
            expectedVsActual: {
                totalClaimed,
                totalPaid: totalPaidAmount,
                reimbursementRate: totalClaimed > 0 ? (totalPaidAmount / totalClaimed * 100) : 0
            },
            alerts
        })

    } catch (error) {
        console.error("[INSURANCE_PANEL_GET]", error)
        // If insurance_claims table doesn't exist, return empty panel (graceful degradation)
        const msg = String((error as Error)?.message ?? "")
        if (msg.includes("does not exist") || msg.includes("relation")) {
            return NextResponse.json({
                claimsSubmitted: { count: 0, value: 0 },
                claimsPending14Plus: { count: 0, value: 0 },
                deniedClaims: { count: 0, value: 0 },
                avgDaysToPayment: 0,
                expectedVsActual: { totalClaimed: 0, totalPaid: 0, reimbursementRate: 0 },
                alerts: []
            })
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
