"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DollarSign,
    TrendingUp,
    Activity,
    Sparkles,
    Loader2,
    Clock,
    BarChart3,
    Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppointmentReminderModal } from "@/components/dashboard/appointment-reminder-modal"
import { Sparkline } from "@/components/dashboard/sparkline"
import { DashboardKPISkeletons } from "@/components/dashboard/dashboard-kpi-skeletons"
import { InsuranceClaimsPanel } from "@/components/dashboard/insurance-claims-panel"
import { CashFlowPanel } from "@/components/dashboard/cash-flow-panel"
import { RevenueIntelligencePanel } from "@/components/dashboard/revenue-intelligence-panel"
import { ChairUtilizationPanel } from "@/components/dashboard/chair-utilization-panel"
import { AlertCenter } from "@/components/dashboard/alert-center"
import { formatCurrency } from "@/lib/financial-utils"

interface DashboardStats {
    revenue: {
        total: number
        change: number
        changeAmount: number
        trend: number[]
    }
    production: {
        today: number
        mtd: number
        collectedToday: number
        collectionRate: number
    }
    claims: {
        outstanding: number
        count: number
    }
    arTotal: number
    patients: {
        total: number
        newThisMonth: number
    }
    appointments: {
        total: number
        today: number
        growth: number
        lastMonth: number
        trend: number[]
    }
    completionRate: number
    completionRateChange: number
}

export default function DashboardPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const firstName = profile?.first_name || "Doctor"

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const statsRes = await fetch("/api/dashboard/stats")

            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    const handleViewReports = () => {
        router.push("/reports")
    }

    const handleTodayFilter = () => {
        fetchDashboardData()
        toast.success("Showing today's data")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <AppointmentReminderModal />
            
            {/* Spacious Container */}
            <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-8 lg:py-12 space-y-12">
                
                {/* Clean Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
                            Welcome back, {firstName}
                        </h1>
                        <p className="text-lg text-slate-600 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-teal-500" />
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <AlertCenter />
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            onClick={handleTodayFilter}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button
                            size="lg"
                            className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20"
                            onClick={handleViewReports}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Reports
                        </Button>
                    </div>
                </div>

                {/* Tabs for Organization */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-slate-200 p-1 h-auto mb-8">
                        <TabsTrigger 
                            value="overview" 
                            className="px-6 py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg text-base font-medium"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger 
                            value="financial" 
                            className="px-6 py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg text-base font-medium"
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Financial
                        </TabsTrigger>
                        <TabsTrigger 
                            value="operations" 
                            className="px-6 py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg text-base font-medium"
                        >
                            <Activity className="mr-2 h-4 w-4" />
                            Operations
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8 mt-0">
                        {/* Key Metrics - 3 Column Grid for Better Spacing */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Today's Snapshot</h2>
                            <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {loading ? (
                                    <>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                    </>
                                ) : (
                                    <>
                                        {/* Today's Production */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-14 w-14 rounded-2xl bg-teal-100 flex items-center justify-center">
                                                        <DollarSign className="h-7 w-7 text-teal-600" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">Today's Production</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? formatCurrency(stats.production.today) : "$0"}
                                                </p>
                                                <p className="text-sm text-slate-600">Scheduled for today</p>
                                            </CardContent>
                                        </Card>

                                        {/* Collected Today */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -mr-16 -mt-16"></div>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                                        <TrendingUp className="h-7 w-7 text-emerald-600" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">Collected Today</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? formatCurrency(stats.production.collectedToday) : "$0"}
                                                </p>
                                                <p className="text-sm text-slate-600">Payments received</p>
                                            </CardContent>
                                        </Card>

                                        {/* Collection Rate */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16"></div>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                                        <Activity className="h-7 w-7 text-blue-600" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">Collection Rate</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? `${stats.production.collectionRate.toFixed(1)}%` : "0%"}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {stats && stats.production.collectionRate >= 90 ? "Above target" : "Track closely"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Revenue Intelligence - Single Focus */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Revenue Pipeline</h2>
                            <RevenueIntelligencePanel />
                        </div>
                    </TabsContent>

                    {/* Financial Tab */}
                    <TabsContent value="financial" className="space-y-8 mt-0">
                        {/* Financial KPIs - 3 Column */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Financial Metrics</h2>
                            <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {loading ? (
                                    <>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 h-48"></div>
                                    </>
                                ) : (
                                    <>
                                        {/* MTD Production */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <CardHeader className="pb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                                                    <TrendingUp className="h-7 w-7 text-purple-600" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">MTD Production</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? formatCurrency(stats.production.mtd) : "$0"}
                                                </p>
                                                <p className="text-sm text-slate-600">Month-to-date</p>
                                            </CardContent>
                                        </Card>

                                        {/* Outstanding Claims */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <CardHeader className="pb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                    <Bell className="h-7 w-7 text-amber-600" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">Insurance Claims</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? formatCurrency(stats.claims.outstanding) : "$0"}
                                                </p>
                                                <p className="text-sm text-slate-600">{stats?.claims.count || 0} pending</p>
                                            </CardContent>
                                        </Card>

                                        {/* AR Total */}
                                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <CardHeader className="pb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center">
                                                    <DollarSign className="h-7 w-7 text-rose-600" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm font-medium text-slate-500 mb-2">Accounts Receivable</p>
                                                <p className="text-4xl font-bold text-slate-900 mb-1">
                                                    {stats ? formatCurrency(stats.arTotal) : "$0"}
                                                </p>
                                                <p className="text-sm text-slate-600">Outstanding balance</p>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financial Panels - Stack Vertically for Better Focus */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Insurance Management</h2>
                                <InsuranceClaimsPanel />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Cash Flow Analysis</h2>
                                <CashFlowPanel />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Operations Tab */}
                    <TabsContent value="operations" className="space-y-8 mt-0">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Today's Operations</h2>
                            <ChairUtilizationPanel />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
