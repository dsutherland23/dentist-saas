"use client"

import {
    Calendar,
    DollarSign,
    FileText,
    ClipboardList,
    Users,
    TrendingUp,
    TrendingDown,
    Wallet,
    Percent,
    UserPlus,
} from "lucide-react"
import { formatCurrency } from "@/lib/financial-utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface DashboardKpiStripProps {
    loading?: boolean
    stats: {
        appointments: { today: number; growth: number }
        revenue: { total: number; change: number }
        claims: { outstanding: number; count: number }
        patients: { total: number }
        /** Optional quick-stats merged into strip */
        arTotal?: number
        completionRate?: number
        newPatientsThisMonth?: number
    } | null
    pendingTreatmentPlansCount?: number
}

type Stats = NonNullable<DashboardKpiStripProps["stats"]>
type Extra = { pendingTreatmentPlansCount?: number }

const cardConfig = [
    {
        key: "appointments" as const,
        label: "Today's appointments",
        icon: Calendar,
        getValue: (s: Stats, _e?: Extra) => String(s.appointments.today),
        getTrend: (s: Stats) => s.appointments.growth,
    },
    {
        key: "revenue" as const,
        label: "Monthly revenue",
        icon: DollarSign,
        getValue: (s: Stats, _e?: Extra) => formatCurrency(s.revenue.total),
        getTrend: (s: Stats) => s.revenue.change,
    },
    {
        key: "claims" as const,
        label: "Outstanding claims",
        icon: FileText,
        getValue: (s: Stats, _e?: Extra) => formatCurrency(s.claims.outstanding),
        getTrend: null as null | ((s: Stats) => number),
        getSub: (s: Stats) =>
            s.claims.count > 0 ? `${s.claims.count} pending` : null,
    },
    {
        key: "treatmentPlans" as const,
        label: "Pending treatment plans",
        icon: ClipboardList,
        getValue: (_s: Stats, e?: Extra) => String(e?.pendingTreatmentPlansCount ?? 0),
        getTrend: null as null | ((s: Stats) => number),
    },
    {
        key: "patients" as const,
        label: "Active patients",
        icon: Users,
        getValue: (s: Stats, _e?: Extra) => String(s.patients.total),
        getTrend: null as null | ((s: Stats) => number),
    },
]

function KpiCardSkeleton() {
    return (
        <div className="dashboard-kpi-card">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-24 mb-2 bg-slate-100" />
                    <Skeleton className="h-8 w-20 bg-slate-100" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-100 flex-shrink-0" />
            </div>
        </div>
    )
}

export function DashboardKpiStrip({
    loading,
    stats,
    pendingTreatmentPlansCount = 0,
}: DashboardKpiStripProps) {
    if (loading) {
        return (
            <section className="space-y-4" aria-label="Key metrics">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {cardConfig.map((_, i) => (
                        <KpiCardSkeleton key={i} />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-1">
                            <Skeleton className="h-9 w-9 rounded-lg bg-slate-100" />
                            <Skeleton className="h-4 flex-1 max-w-32 bg-slate-100" />
                            <Skeleton className="h-4 w-16 bg-slate-100" />
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    const extra = { pendingTreatmentPlansCount }

    const quickStats = [
        {
            key: "ar" as const,
            label: "AR total",
            icon: Wallet,
            value: stats?.arTotal != null ? formatCurrency(Number(stats.arTotal)) : "—",
        },
        {
            key: "completion" as const,
            label: "Completion rate",
            icon: Percent,
            value: stats?.completionRate != null ? `${Number(stats.completionRate).toFixed(1)}%` : "—",
        },
        {
            key: "newPatients" as const,
            label: "New patients (month)",
            icon: UserPlus,
            value: stats?.newPatientsThisMonth != null ? String(stats.newPatientsThisMonth) : "—",
        },
    ]

    return (
        <section className="space-y-4" aria-label="Key metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {cardConfig.map(({ key, label, icon: Icon, getValue, getTrend, getSub }) => (
                    <div
                        key={key}
                        className="dashboard-kpi-card group"
                        role="article"
                        aria-label={`${label}: ${key === "treatmentPlans" ? pendingTreatmentPlansCount : stats ? getValue(stats, extra) : "—"}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                                <p className="stat-value text-2xl tracking-tight">
                                    {stats ? (key === "treatmentPlans" ? getValue(stats, extra) : getValue(stats)) : "0"}
                                </p>
                                {getSub && stats && getSub(stats) && (
                                    <p className="text-xs text-slate-500 mt-1">{getSub(stats)}</p>
                                )}
                                {getTrend != null && stats && (() => {
                                    const trendVal = getTrend(stats)
                                    return typeof trendVal === "number" && Number.isFinite(trendVal)
                                })() && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                        {(getTrend(stats) as number) >= 0 ? (
                                            <TrendingUp className="h-3.5 w-3.5 text-teal-600" aria-hidden />
                                        ) : (
                                            <TrendingDown className="h-3.5 w-3.5 text-rose-500" aria-hidden />
                                        )}
                                        <span
                                            className={
                                                (getTrend(stats) as number) >= 0
                                                    ? "text-xs font-medium text-teal-600"
                                                    : "text-xs font-medium text-rose-600"
                                            }
                                        >
                                            {Math.abs(getTrend(stats) as number).toFixed(1)}% vs last month
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/15 transition-colors">
                                <Icon className="h-5 w-5 text-teal-600" aria-hidden />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Merged quick stats: AR total, completion rate, new patients */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
                {quickStats.map(({ key, label, icon: Icon, value }) => (
                    <div
                        key={key}
                        className="flex items-center justify-between gap-3 py-1"
                        role="article"
                        aria-label={`${label}: ${value}`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-teal-600" aria-hidden />
                            </div>
                            <span className="text-sm font-medium text-slate-600 truncate">{label}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">{value}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
