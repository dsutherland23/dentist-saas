"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import { formatCurrency } from "@/lib/financial-utils"

const TEAL = "#0d9488"

interface DashboardRevenueChartProps {
    trend: number[]
    loading?: boolean
    /** Day labels for last 7 days (e.g. from getLast7DaysChartLabels()); last is often "Today" */
    labels?: string[]
}

const DEFAULT_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function DashboardRevenueChart({ trend, loading, labels: labelsProp }: DashboardRevenueChartProps) {
    if (loading || !trend?.length) {
        return (
            <div className="dashboard-chart-card h-[240px] flex items-center justify-center">
                {loading ? (
                    <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
                ) : (
                    <p className="text-sm text-slate-500">No revenue data</p>
                )}
            </div>
        )
    }

    const labels = labelsProp?.length === trend.length ? labelsProp : DEFAULT_DAY_LABELS
    const data = trend.map((value, i) => ({
        day: labels[i] ?? `Day ${i + 1}`,
        value,
        full: value,
    }))

    return (
        <div className="dashboard-chart-card p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Revenue trend (last 7 days)</h3>
            <div className="h-[200px] min-h-[200px] w-full min-w-0" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid rgb(241 245 249)",
                                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.04)",
                            }}
                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
                            labelStyle={{ color: "#475569" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={TEAL}
                            strokeWidth={2}
                            fill="url(#revenue-gradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
