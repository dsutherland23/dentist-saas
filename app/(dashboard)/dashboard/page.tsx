"use client"

import { useState } from "react"
import { Clock, BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppointmentReminderModal } from "@/components/dashboard/appointment-reminder-modal"
import { DashboardKpiStrip } from "@/components/dashboard/dashboard-kpi-strip"
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart"
import { DashboardAppointmentChart } from "@/components/dashboard/dashboard-appointment-chart"
import { DashboardClaimsDonut } from "@/components/dashboard/dashboard-claims-donut"
import { DashboardQuickStats } from "@/components/dashboard/dashboard-quick-stats"
import { DashboardOverviewAppointments } from "@/components/dashboard/dashboard-overview-appointments"
import { DashboardTreatmentPlanPipeline } from "@/components/dashboard/dashboard-treatment-plan-pipeline"
import { DashboardAlertsPanel } from "@/components/dashboard/dashboard-alerts-panel"
import { QuickActionsFab } from "@/components/dashboard/quick-actions-fab"
import { useDashboardData, getLast7DaysChartLabels } from "@/lib/use-dashboard-data"

export default function DashboardPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const firstName = profile?.first_name || "Doctor"
    const [refreshKey, setRefreshKey] = useState(0)

    const {
        stats,
        claimsSummary,
        pendingTreatmentPlansCount,
        loading,
        refreshing,
        error,
        refresh,
    } = useDashboardData({ refetchOnWindowFocus: true })

    const handleRefresh = () => {
        setRefreshKey((k) => k + 1)
        refresh().then(() => toast.success("Dashboard updated"))
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
            <AppointmentReminderModal />
            <QuickActionsFab />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 min-w-0 w-full overflow-x-hidden box-border">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                            {firstName}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                        >
                            {(loading || refreshing) ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
                                    {loading ? "Loading…" : "Refreshing…"}
                                </>
                            ) : (
                                "Refresh"
                            )}
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => router.push("/reports")}
                        >
                            <BarChart3 className="h-4 w-4 mr-1.5" aria-hidden />
                            Reports
                        </Button>
                    </div>
                </header>

                {/* Error state */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
                        <p className="text-sm text-rose-800">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-100"
                            onClick={() => refresh()}
                        >
                            Try again
                        </Button>
                    </div>
                )}

                {/* KPI strip */}
                <section className="mb-8">
                    <DashboardKpiStrip
                        loading={loading}
                        stats={stats ? {
                            appointments: { today: stats.appointments.today, growth: stats.appointments.growth },
                            revenue: { total: stats.revenue.total, change: stats.revenue.change },
                            claims: { outstanding: stats.claims.outstanding, count: stats.claims.count },
                            patients: { total: stats.patients.total },
                        } : null}
                        pendingTreatmentPlansCount={pendingTreatmentPlansCount}
                    />
                </section>

                {/* Middle: two columns - charts left, donut + quick stats right */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <DashboardRevenueChart trend={stats?.revenue?.trend ?? []} loading={loading} labels={getLast7DaysChartLabels()} />
                        <DashboardAppointmentChart trend={stats?.appointments?.trend ?? []} loading={loading} labels={getLast7DaysChartLabels()} />
                    </div>
                    <div className="space-y-6">
                        <DashboardClaimsDonut summary={claimsSummary} loading={loading} />
                        <DashboardQuickStats
                            loading={loading}
                            stats={stats ? {
                                arTotal: stats.arTotal,
                                completionRate: stats.completionRate,
                                patients: { newThisMonth: stats.patients.newThisMonth },
                            } : null}
                        />
                    </div>
                </section>

                {/* Lower: upcoming appointments, treatment plan pipeline, alerts */}
                <section className="space-y-8">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-4">Upcoming & pipeline</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <DashboardOverviewAppointments refreshKey={refreshKey} />
                            </div>
                            <div>
                                <DashboardTreatmentPlanPipeline refreshKey={refreshKey} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-4">Alerts</h2>
                        <DashboardAlertsPanel refreshKey={refreshKey} />
                    </div>
                </section>
            </div>
        </div>
    )
}
