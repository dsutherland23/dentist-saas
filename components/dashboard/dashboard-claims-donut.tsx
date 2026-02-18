"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export interface ClaimsSummary {
    pending: number
    paid: number
    rejected: number
}

const COLORS = ["#f59e0b", "#10b981", "#ef4444"] // amber (pending), emerald (paid), rose (rejected)

interface DashboardClaimsDonutProps {
    summary: ClaimsSummary | null
    loading?: boolean
}

export function DashboardClaimsDonut({ summary, loading }: DashboardClaimsDonutProps) {
    if (loading) {
        return (
            <div className="dashboard-chart-card h-[260px] flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
            </div>
        )
    }

    const data = summary
        ? [
              { name: "Pending", value: summary.pending, color: COLORS[0] },
              { name: "Paid", value: summary.paid, color: COLORS[1] },
              { name: "Rejected", value: summary.rejected, color: COLORS[2] },
          ].filter((d) => d.value > 0)
        : []

    if (!summary || data.length === 0) {
        return (
            <div className="dashboard-chart-card p-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-4">Claims status</h3>
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                    No claims data
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-chart-card p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Claims status</h3>
            <div className="h-[200px] min-h-[200px] w-full min-w-0" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={72}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid rgb(241 245 249)",
                                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.04)",
                            }}
                            formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, name ?? ""]}
                        />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            formatter={(value, entry) => (
                                <span className="text-xs text-slate-600">
                                    {value}: {(entry.payload as { value: number }).value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
