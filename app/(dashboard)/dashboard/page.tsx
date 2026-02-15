"use client"

import { useEffect, useState } from "react"
import {
    DollarSign,
    TrendingUp,
    Activity,
    Loader2,
    Clock,
    BarChart3,
    Bell,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppointmentReminderModal } from "@/components/dashboard/appointment-reminder-modal"
import { InsuranceClaimsPanel } from "@/components/dashboard/insurance-claims-panel"
import { CashFlowPanel } from "@/components/dashboard/cash-flow-panel"
import { RevenueIntelligencePanel } from "@/components/dashboard/revenue-intelligence-panel"
import { ChairUtilizationPanel } from "@/components/dashboard/chair-utilization-panel"
import { DashboardOverviewAppointments } from "@/components/dashboard/dashboard-overview-appointments"
import { formatCurrency } from "@/lib/financial-utils"
import { fetchWithAuth } from "@/lib/fetch-client"

interface DashboardStats {
    revenue: { total: number; change: number; changeAmount: number; trend: number[] }
    production: { today: number; mtd: number; collectedToday: number; collectionRate: number }
    claims: { outstanding: number; count: number }
    arTotal: number
    patients: { total: number; newThisMonth: number }
    appointments: { total: number; today: number; growth: number; lastMonth: number; trend: number[] }
    completionRate: number
    completionRateChange: number
}

const statCardConfig = [
    {
        key: "production" as const,
        label: "Today's production",
        icon: DollarSign,
        color: "text-teal-600",
        bg: "bg-teal-500/8",
        border: "border-l-teal-500",
    },
    {
        key: "collected" as const,
        label: "Collected today",
        icon: TrendingUp,
        color: "text-emerald-600",
        bg: "bg-emerald-500/8",
        border: "border-l-emerald-500",
    },
    {
        key: "rate" as const,
        label: "Collection rate",
        icon: Activity,
        color: "text-blue-600",
        bg: "bg-blue-500/8",
        border: "border-l-blue-500",
    },
]

export default function DashboardPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const firstName = profile?.first_name || "Doctor"
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("overview")
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)
            const statsRes = await fetchWithAuth("/api/dashboard/stats")
            if (!statsRes.ok) {
                const errBody = await statsRes.json().catch(() => ({}))
                throw new Error(errBody.error || `Request failed: ${statsRes.status}`)
            }
            const data = await statsRes.json()
            setStats(data)
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to load dashboard"
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = () => {
        setRefreshKey(k => k + 1)
        fetchDashboardData().then(() => toast.success("Dashboard updated"))
    }

    const getStatValue = (key: string) => {
        if (!stats) return null
        switch (key) {
            case "production":
                return formatCurrency(stats.production.today)
            case "collected":
                return formatCurrency(stats.production.collectedToday)
            case "rate":
                return `${stats.production.collectionRate.toFixed(1)}%`
            default:
                return null
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
            <AppointmentReminderModal />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 min-w-0 w-full overflow-x-hidden box-border">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                            {firstName}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
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
                            disabled={loading}
                        >
                            {loading ? "Refreshing…" : "Refresh"}
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 bg-slate-900 hover:bg-slate-800 text-white"
                            onClick={() => router.push("/reports")}
                        >
                            <BarChart3 className="h-4 w-4 mr-1.5" />
                            Reports
                        </Button>
                    </div>
                </header>

                {/* Error state */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
                        <p className="text-sm text-rose-800">{error}</p>
                        <Button variant="outline" size="sm" className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-100" onClick={fetchDashboardData}>
                            Try again
                        </Button>
                    </div>
                )}

                {/* Key metrics strip */}
                <section className="mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {statCardConfig.map(({ key, label, icon: Icon, color, bg, border }) => (
                            <div
                                key={key}
                                className={`dashboard-stat-card border-l-4 ${border}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="dashboard-section-title mb-1.5">{label}</p>
                                        {loading ? (
                                            <div className="h-9 w-24 rounded bg-slate-100 animate-pulse" />
                                        ) : (
                                            <p className="stat-value text-2xl sm:text-3xl">
                                                {getStatValue(key) ?? "—"}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`h-5 w-5 ${color}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="dashboard-segmented mb-8 h-auto p-1 bg-transparent">
                        <TabsTrigger
                            value="overview"
                            className="dashboard-segmented-trigger data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="financial"
                            className="dashboard-segmented-trigger data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            Financial
                        </TabsTrigger>
                        <TabsTrigger
                            value="operations"
                            className="dashboard-segmented-trigger data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            Operations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0 space-y-10">
                        <section>
                            <h2 className="dashboard-section-title mb-4">Appointments & status</h2>
                            <DashboardOverviewAppointments refreshKey={refreshKey} />
                        </section>
                        <section>
                            <h2 className="dashboard-section-title mb-4">Revenue pipeline</h2>
                            <RevenueIntelligencePanel key={refreshKey} />
                        </section>
                    </TabsContent>

                    <TabsContent value="financial" className="mt-0 space-y-10">
                        <section>
                            <h2 className="dashboard-section-title mb-4">Financial metrics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    {
                                        label: "MTD production",
                                        value: stats ? formatCurrency(stats.production.mtd) : "—",
                                        icon: TrendingUp,
                                        border: "border-l-violet-500",
                                    },
                                    {
                                        label: "Insurance claims",
                                        value: stats ? formatCurrency(stats.claims.outstanding) : "—",
                                        sub: stats ? `${stats.claims.count} pending` : "",
                                        icon: Bell,
                                        border: "border-l-amber-500",
                                    },
                                    {
                                        label: "Accounts receivable",
                                        value: stats ? formatCurrency(stats.arTotal) : "—",
                                        icon: DollarSign,
                                        border: "border-l-rose-500",
                                    },
                                ].map(({ label, value, sub, icon: Icon, border }) => (
                                    <div key={label} className={`dashboard-stat-card border-l-4 ${border}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="dashboard-section-title mb-1.5">{label}</p>
                                                <p className="stat-value text-2xl">{value}</p>
                                                {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
                                            </div>
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Icon className="h-5 w-5 text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h2 className="dashboard-section-title mb-4">Insurance</h2>
                            <InsuranceClaimsPanel refreshKey={refreshKey} />
                        </section>
                        <section>
                            <h2 className="dashboard-section-title mb-4">Cash flow</h2>
                            <CashFlowPanel refreshKey={refreshKey} />
                        </section>
                    </TabsContent>

                    <TabsContent value="operations" className="mt-0">
                        <section>
                            <h2 className="dashboard-section-title mb-4">Today's operations</h2>
                            <ChairUtilizationPanel refreshKey={refreshKey} />
                        </section>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
