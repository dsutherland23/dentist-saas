"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    Clock,
    AlertCircle,
    XCircle,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChairUtilizationData {
    utilizationByChair: Array<{
        operatory: string
        dentist_name: string
        total_appointments: number
        total_hours: number
        utilization_percent: number
        utilizationLevel: 'excellent' | 'good' | 'needs-improvement'
    }>
    todaySummary: {
        totalAppointments: number
        bookedHours: number
        completedCount: number
        cancelledCount: number
        noShowCount: number
        operatoriesInUse: number
        providersScheduled: number
        emptyChairTime: number
    }
}

interface ChairUtilizationPanelProps {
    refreshKey?: number
}

export function ChairUtilizationPanel({ refreshKey = 0 }: ChairUtilizationPanelProps) {
    const [data, setData] = useState<ChairUtilizationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetchWithAuth("/api/dashboard/chair-utilization")
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || `Failed to load: ${res.status}`)
            }
            const json = await res.json()
            setData(json)
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to load operations data"
            setError(message)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [refreshKey])

    if (loading && !data) {
        return (
            <div className="dashboard-panel">
                <div className="dashboard-panel-body flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="dashboard-panel">
                <div className="dashboard-panel-body flex flex-col items-center justify-center py-16 gap-4">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                    <p className="text-sm text-slate-600 text-center">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchData}>Try again</Button>
                </div>
            </div>
        )
    }

    if (!data) {
        return null
    }

    const summary = data.todaySummary ?? {}
    const totalAppointments = Number(summary.totalAppointments) ?? 0
    const bookedHours = Number(summary.bookedHours) ?? 0
    const completedCount = Number(summary.completedCount) ?? 0
    const cancelledCount = Number(summary.cancelledCount) ?? 0
    const noShowCount = Number(summary.noShowCount) ?? 0
    const operatoriesInUse = Number(summary.operatoriesInUse) ?? 0
    const providersScheduled = Number(summary.providersScheduled) ?? 0
    const emptyChairTime = Number(summary.emptyChairTime) ?? 0

    const getUtilizationColor = (level: string) => {
        switch (level) {
            case 'excellent':
                return 'bg-emerald-500'
            case 'good':
                return 'bg-amber-500'
            case 'needs-improvement':
                return 'bg-rose-500'
            default:
                return 'bg-slate-300'
        }
    }

    const getUtilizationBadgeColor = (level: string) => {
        switch (level) {
            case 'excellent':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'good':
                return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'needs-improvement':
                return 'bg-rose-100 text-rose-800 border-rose-200'
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h3 className="text-sm font-semibold text-slate-900">Appointment & chair utilization</h3>
                <p className="text-xs text-slate-500 mt-0.5">Today's schedule and operatory efficiency</p>
            </div>
            <div className="dashboard-panel-body">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left: Today's Schedule Summary */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Today's Schedule
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 mb-2" />
                                <p className="text-2xl font-bold text-blue-900">
                                    {completedCount}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">Completed</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100">
                                <Calendar className="h-5 w-5 text-teal-600 mb-2" />
                                <p className="text-2xl font-bold text-teal-900">
                                    {totalAppointments}
                                </p>
                                <p className="text-xs text-teal-700 mt-1">Total Booked</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
                                <XCircle className="h-5 w-5 text-amber-600 mb-2" />
                                <p className="text-2xl font-bold text-amber-900">
                                    {cancelledCount}
                                </p>
                                <p className="text-xs text-amber-700 mt-1">Cancelled</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100">
                                <AlertCircle className="h-5 w-5 text-rose-600 mb-2" />
                                <p className="text-2xl font-bold text-rose-900">
                                    {noShowCount}
                                </p>
                                <p className="text-xs text-rose-700 mt-1">No-Shows</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-slate-600" />
                                    <span className="text-sm font-bold text-slate-900">Time Utilization</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {operatoriesInUse} chairs active
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Booked Hours:</span>
                                    <span className="font-semibold text-slate-900">
                                        {bookedHours.toFixed(1)}h
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Empty Chair Time:</span>
                                    <span className="font-semibold text-slate-900">
                                        {emptyChairTime.toFixed(1)}h
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Providers Scheduled:</span>
                                    <span className="font-semibold text-slate-900">
                                        {providersScheduled}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Chair Utilization Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Chair Utilization %
                        </h3>

                        {(data.utilizationByChair?.length ?? 0) === 0 ? (
                            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-700">
                                    No operatory data available
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Assign room numbers to appointments to track utilization
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(data.utilizationByChair ?? []).map((chair, index) => {
                                    const pct = Number(chair.utilization_percent) ?? 0
                                    const hours = Number(chair.total_hours) ?? 0
                                    return (
                                        <div
                                            key={chair.operatory ? `${chair.operatory}-${index}` : index}
                                            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {chair.operatory || "Unassigned"}
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {chair.dentist_name}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`${getUtilizationBadgeColor(chair.utilizationLevel)} text-xs font-bold`}
                                                >
                                                    {pct.toFixed(0)}%
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getUtilizationColor(chair.utilizationLevel)} transition-all duration-500`}
                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-600">
                                                    <span>{Number(chair.total_appointments) ?? 0} appointments</span>
                                                    <span>{hours.toFixed(1)}h booked</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Utilization Legend */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Utilization Levels
                            </p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-slate-700">90-100% = Excellent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <span className="text-slate-700">70-89% = Good</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <span className="text-slate-700">&lt;70% = Needs Improvement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
