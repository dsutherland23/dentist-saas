"use client"

import { DollarSign, TrendingUp, UserPlus } from "lucide-react"
import { formatCurrency } from "@/lib/financial-utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface DashboardQuickStatsProps {
    loading?: boolean
    stats: {
        arTotal: number
        completionRate: number
        patients: { newThisMonth: number }
    } | null
}

function safeNum(n: unknown): number {
    const v = Number(n)
    return Number.isFinite(v) ? v : 0
}

const items = [
    {
        key: "ar" as const,
        label: "AR total",
        icon: DollarSign,
        getValue: (s: NonNullable<DashboardQuickStatsProps["stats"]>) =>
            formatCurrency(safeNum(s.arTotal)),
    },
    {
        key: "completion" as const,
        label: "Completion rate",
        icon: TrendingUp,
        getValue: (s: NonNullable<DashboardQuickStatsProps["stats"]>) =>
            `${safeNum(s.completionRate).toFixed(1)}%`,
    },
    {
        key: "newPatients" as const,
        label: "New patients (month)",
        icon: UserPlus,
        getValue: (s: NonNullable<DashboardQuickStatsProps["stats"]>) =>
            String(safeNum(s.patients.newThisMonth)),
    },
]

export function DashboardQuickStats({ loading, stats }: DashboardQuickStatsProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {items.map((_, i) => (
                    <div key={i} className="dashboard-kpi-card p-4">
                        <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-4 w-24 bg-slate-100" />
                            <Skeleton className="h-6 w-14 bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3" role="group" aria-label="Quick stats">
            {items.map(({ key, label, icon: Icon, getValue }) => (
                <div
                    key={key}
                    className="dashboard-kpi-card p-4 flex items-center justify-between gap-3"
                    role="article"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-teal-600" aria-hidden />
                        </div>
                        <span className="text-sm font-medium text-slate-600 truncate">{label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
                        {stats ? getValue(stats) : "—"}
                    </span>
                </div>
            ))}
        </div>
    )
}
