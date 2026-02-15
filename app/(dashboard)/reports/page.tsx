"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { Download, Calendar, TrendingUp, Users, Activity, Loader2, AlertCircle } from "lucide-react"

interface ReportData {
    revenueData: { name: string; value: number }[]
    treatmentDistribution: { name: string; value: number }[]
    staffPerformance: { name: string; appointments: number }[]
    metrics: {
        totalRevenue: number
        revenueGrowth: number
        appointmentCount: number
        patientCount: number
        newPatients: number
        patientGrowth: number
    }
}

const EMPTY_DATA: ReportData = {
    revenueData: [],
    treatmentDistribution: [],
    staffPerformance: [],
    metrics: {
        totalRevenue: 0,
        revenueGrowth: 0,
        appointmentCount: 0,
        patientCount: 0,
        newPatients: 0,
        patientGrowth: 0,
    }
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/reports/stats')
                if (!res.ok) {
                    const text = await res.text().catch(() => "Unknown error")
                    setError(res.status === 401 ? "Please log in to view reports." : res.status === 404 ? "Complete your clinic setup first." : `Failed to load reports: ${text}`)
                    return
                }
                const json = await res.json()
                setData(json)
            } catch (err) {
                console.error("Error fetching report stats:", err)
                setError("Failed to connect. Please check your connection and try again.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    const handleExport = () => {
        const d = data || EMPTY_DATA

        const headers = ["Category", "Name", "Value"]
        const csvRows = [headers.join(",")]

        csvRows.push(`Metric,Total Revenue,${d.metrics.totalRevenue}`)
        csvRows.push(`Metric,Patient Count,${d.metrics.patientCount}`)
        csvRows.push(`Metric,Appointments,${d.metrics.appointmentCount}`)

        d.revenueData.forEach((row) => {
            csvRows.push(`Revenue,${row.name},${row.value}`)
        })

        d.treatmentDistribution.forEach((row) => {
            csvRows.push(`Treatment,${row.name},${row.value}`)
        })

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('hidden', '')
        a.setAttribute('href', url)
        a.setAttribute('download', `practice_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Unable to load reports</h2>
                    <p className="text-slate-500">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Try again
                    </Button>
                </div>
            </div>
        )
    }

    // Use data with fallback to empty values
    const d = data || EMPTY_DATA

    const COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444"]

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Practice Analytics</h1>
                    <p className="text-slate-500 mt-1 text-sm">Real-time performance metrics and business health</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
                    <Button variant="outline" className="bg-white">
                        <Calendar className="mr-2 h-4 w-4" /> This Month
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${d.metrics.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className={d.metrics.revenueGrowth >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                                {d.metrics.revenueGrowth >= 0 ? "+" : ""}{d.metrics.revenueGrowth}%
                            </span> from previous month
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Patients</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{d.metrics.newPatients}</div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="text-emerald-600 font-medium">+{d.metrics.patientGrowth}%</span> growth rate
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                        <Activity className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{d.metrics.appointmentCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Practice volume for current month</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList className="bg-white border p-1 h-auto gap-1">
                    <TabsTrigger value="revenue" className="px-6 py-2">Revenue Growth</TabsTrigger>
                    <TabsTrigger value="treatments" className="px-6 py-2">Treatment Analytics</TabsTrigger>
                    <TabsTrigger value="performance" className="px-6 py-2">Staff Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Flow</CardTitle>
                            <CardDescription>Daily revenue trends for the current period</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {d.revenueData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">No revenue data yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={d.revenueData}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(v: number | any) => [v ? `$${v.toLocaleString()}` : "$0", 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="treatments">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Procedure Distribution</CardTitle>
                                <CardDescription>Most frequent treatments performed</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {d.treatmentDistribution.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400">No treatment data yet</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={d.treatmentDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {d.treatmentDistribution.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Volume by Treatment</CardTitle>
                                <CardDescription>Number of procedures by type</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {d.treatmentDistribution.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400">No treatment data yet</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={d.treatmentDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Appointment Volume</CardTitle>
                            <CardDescription>Appointments completed per staff member</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {d.staffPerformance.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">No staff data yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={d.staffPerformance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={150} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Bar dataKey="appointments" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
