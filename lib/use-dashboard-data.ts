"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/fetch-client"

export interface DashboardStats {
    revenue: { total: number; change: number; changeAmount: number; trend: number[] }
    production: { today: number; mtd: number; collectedToday: number; collectionRate: number }
    claims: { outstanding: number; count: number }
    arTotal: number
    patients: { total: number; newThisMonth: number }
    appointments: { total: number; today: number; growth: number; lastMonth: number; trend: number[] }
    completionRate: number
    completionRateChange: number
}

export interface ClaimsSummary {
    pending: number
    paid: number
    rejected: number
}

export interface UseDashboardDataOptions {
    /** Refetch when window regains focus (default: true) */
    refetchOnWindowFocus?: boolean
    /** Auto-refresh interval in ms; 0 = disabled (default: 0) */
    autoRefreshMs?: number
}

export interface UseDashboardDataResult {
    stats: DashboardStats | null
    claimsSummary: ClaimsSummary | null
    pendingTreatmentPlansCount: number
    loading: boolean
    /** True when a background refresh is in progress (e.g. after initial load) */
    refreshing: boolean
    error: string | null
    refresh: () => Promise<void>
}

/**
 * Centralized dashboard data: stats, claims summary, and pending treatment plan count.
 * Supports refresh, optional refetch on window focus, and optional auto-refresh.
 * On refresh (after initial load), keeps showing previous data while refreshing (stale-while-revalidate).
 */
export function useDashboardData(
    options: UseDashboardDataOptions = {}
): UseDashboardDataResult {
    const {
        refetchOnWindowFocus = true,
        autoRefreshMs = 0,
    } = options

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [claimsSummary, setClaimsSummary] = useState<ClaimsSummary | null>(null)
    const [pendingTreatmentPlansCount, setPendingTreatmentPlansCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async (isRefresh: boolean) => {
        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        setError(null)

        try {
            const [statsRes, claimsRes, plansRes] = await Promise.all([
                fetchWithAuth("/api/dashboard/stats"),
                fetchWithAuth("/api/dashboard/claims-summary").catch(() => null),
                fetchWithAuth("/api/treatment-plans").catch(() => null),
            ])

            if (!statsRes.ok) {
                const errBody = await statsRes.json().catch(() => ({}))
                throw new Error(errBody.error || `Request failed: ${statsRes.status}`)
            }
            const data: DashboardStats = await statsRes.json()
            setStats(data)

            if (claimsRes?.ok) {
                const claims: ClaimsSummary = await claimsRes.json()
                setClaimsSummary(claims)
            } else {
                setClaimsSummary(null)
            }

            if (plansRes?.ok) {
                const plans = await plansRes.json()
                const list = Array.isArray(plans) ? plans : []
                const pending = list.filter(
                    (p: { status?: string }) =>
                        p.status === "draft" || p.status === "presented"
                ).length
                setPendingTreatmentPlansCount(pending)
            } else {
                setPendingTreatmentPlansCount(0)
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to load dashboard"
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    const refresh = useCallback(() => fetchData(true), [fetchData])

    useEffect(() => {
        fetchData(false)
    }, [fetchData])

    useEffect(() => {
        if (!refetchOnWindowFocus) return
        const onFocus = () => refresh()
        window.addEventListener("focus", onFocus)
        return () => window.removeEventListener("focus", onFocus)
    }, [refetchOnWindowFocus, refresh])

    useEffect(() => {
        if (autoRefreshMs <= 0) return
        const id = setInterval(refresh, autoRefreshMs)
        return () => clearInterval(id)
    }, [autoRefreshMs, refresh])

    return {
        stats,
        claimsSummary,
        pendingTreatmentPlansCount,
        loading,
        refreshing,
        error,
        refresh,
    }
}

/**
 * Last 7 days (index 0 = 6 days ago, index 6 = today) as short labels for charts.
 * Last label is "Today" for clarity.
 */
export function getLast7DaysChartLabels(): string[] {
    const labels: string[] = []
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const isToday = i === 0
        labels.push(isToday ? "Today" : days[d.getDay()])
    }
    return labels
}
