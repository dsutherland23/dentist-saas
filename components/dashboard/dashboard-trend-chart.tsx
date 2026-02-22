"use client"

import { useState } from "react"
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart"
import { DashboardAppointmentChart } from "@/components/dashboard/dashboard-appointment-chart"

export type TrendChartMode = "revenue" | "appointments"

export interface DashboardTrendChartProps {
    revenueTrend: number[]
    appointmentTrend: number[]
    loading?: boolean
    labels?: string[]
}

export function DashboardTrendChart({
    revenueTrend,
    appointmentTrend,
    loading,
    labels,
}: DashboardTrendChartProps) {
    const [mode, setMode] = useState<TrendChartMode>("revenue")

    return (
        <div className="dashboard-chart-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-600">Trend (last 7 days)</h3>
                <div
                    className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5"
                    role="tablist"
                    aria-label="Chart type"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "revenue"}
                        onClick={() => setMode("revenue")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            mode === "revenue"
                                ? "bg-white text-teal-700 shadow-sm border border-slate-200"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Revenue
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "appointments"}
                        onClick={() => setMode("appointments")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            mode === "appointments"
                                ? "bg-white text-teal-700 shadow-sm border border-slate-200"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Appointments
                    </button>
                </div>
            </div>
            {mode === "revenue" ? (
                <DashboardRevenueChart
                    trend={revenueTrend}
                    loading={loading}
                    labels={labels}
                    embedded
                />
            ) : (
                <DashboardAppointmentChart
                    trend={appointmentTrend}
                    loading={loading}
                    labels={labels}
                    embedded
                />
            )}
        </div>
    )
}
