"use client"

import {
    Calendar,
    DollarSign,
    FileText,
    ClipboardList,
    Users,
    TrendingUp,
    TrendingDown,
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
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-label="Key metrics">
                {cardConfig.map((_, i) => (
                    <KpiCardSkeleton key={i} />
                ))}
            </section>
        )
    }

    const extra = { pendingTreatmentPlansCount }

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-label="Key metrics">
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
        </section>
    )
}
