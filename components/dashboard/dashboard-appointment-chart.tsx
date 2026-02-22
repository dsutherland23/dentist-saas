"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
} from "recharts"

const TEAL = "#0d9488"

interface DashboardAppointmentChartProps {
    trend: number[]
    loading?: boolean
    /** Day labels for last 7 days (e.g. from getLast7DaysChartLabels()); last is often "Today" */
    labels?: string[]
    /** When true, render only the chart (no card wrapper or title); for use inside combined chart card */
    embedded?: boolean
}

const DEFAULT_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function DashboardAppointmentChart({ trend, loading, labels: labelsProp, embedded }: DashboardAppointmentChartProps) {
    const emptyOrLoading = loading || !trend?.length
    if (emptyOrLoading) {
        const inner = loading ? (
            <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
        ) : (
            <p className="text-sm text-slate-500">No appointment data</p>
        )
        if (embedded) {
            return <div className="h-[200px] flex items-center justify-center min-w-0">{inner}</div>
        }
        return (
            <div className="dashboard-chart-card h-[240px] flex items-center justify-center">
                {inner}
            </div>
        )
    }

    const labels = labelsProp?.length === trend.length ? labelsProp : DEFAULT_DAY_LABELS
    const data = trend.map((value, i) => ({
        day: labels[i] ?? `Day ${i + 1}`,
        count: value,
    }))

    const chartDiv = (
        <div className="h-[200px] min-h-[200px] w-full min-w-0" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid rgb(241 245 249)",
                                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.04)",
                            }}
                            formatter={(value: number | undefined) => [value ?? 0, "Appointments"]}
                            labelStyle={{ color: "#475569" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke={TEAL}
                            strokeWidth={2}
                            dot={{ fill: TEAL, r: 3 }}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
    )
    if (embedded) return chartDiv
    return (
        <div className="dashboard-chart-card p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Appointment volume (last 7 days)</h3>
            {chartDiv}
        </div>
    )
}
