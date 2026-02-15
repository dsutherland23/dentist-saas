"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Calendar,
    Clock,
    Activity,
    Loader2,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { fetchWithAuth } from "@/lib/fetch-client"

interface ScheduleItem {
    id: string
    time: string
    patient: string
    treatment: string
    status: string
    type: string
}

interface ActivityItem {
    id?: string
    entityType?: string
    name: string
    action: string
    time: string
    type: string
    treatment_type?: string
    start_time?: string
}

export function DashboardOverviewAppointments({ refreshKey = 0 }: { refreshKey?: number }) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loadingSchedule, setLoadingSchedule] = useState(true)
    const [loadingActivity, setLoadingActivity] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoadingSchedule(true)
                const res = await fetchWithAuth("/api/dashboard/schedule")
                if (res.ok) {
                    const data = await res.json()
                    setSchedule(data.schedule || [])
                }
            } catch (e) {
                console.error("Error fetching schedule:", e)
            } finally {
                setLoadingSchedule(false)
            }
        }
        fetchSchedule()
    }, [refreshKey])

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoadingActivity(true)
                const res = await fetchWithAuth("/api/dashboard/activity?limit=15")
                if (res.ok) {
                    const data = await res.json()
                    setActivity(data.activity || [])
                }
            } catch (e) {
                console.error("Error fetching activity:", e)
            } finally {
                setLoadingActivity(false)
            }
        }
        fetchActivity()
    }, [refreshKey])

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-slate-100 text-slate-700 border-slate-200"
            case "checked_in":
            case "in_treatment":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "scheduled":
            case "confirmed":
            case "pending":
            case "unconfirmed":
                return "bg-amber-100 text-amber-800 border-amber-200"
            case "cancelled":
            case "no_show":
                return "bg-rose-100 text-rose-800 border-rose-200"
            default:
                return "bg-slate-100 text-slate-600 border-slate-200"
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            case "warning":
                return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            default:
                return <Activity className="h-4 w-4 text-slate-400 shrink-0" />
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's appointments */}
            <div className="dashboard-panel">
                <div className="dashboard-panel-header flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Today&apos;s appointments</h3>
                        <p className="text-xs text-slate-500 mt-0.5">All appointments and status</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-teal-600 -mr-2"
                        onClick={() => router.push("/calendar")}
                    >
                        View calendar
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
                <div className="dashboard-panel-body">
                    {loadingSchedule ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : schedule.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No appointments today</p>
                            <p className="text-xs mt-1">Schedule is clear</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => router.push("/calendar")}
                            >
                                Go to calendar
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[320px] pr-2">
                            <ul className="space-y-2">
                                {schedule.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-colors flex items-center gap-3"
                                            onClick={() => router.push("/calendar")}
                                        >
                                            <div className="flex-shrink-0 w-12 text-left">
                                                <span className="text-sm font-semibold text-slate-900">{item.time}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{item.patient}</p>
                                                <p className="text-xs text-slate-500 truncate">{item.treatment}</p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`shrink-0 text-[10px] font-medium ${getStatusBadgeClass(item.status)}`}
                                            >
                                                {getAppointmentStatusLabel(item.status)}
                                            </Badge>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    )}
                </div>
            </div>

            {/* Recent activity / status updates */}
            <div className="dashboard-panel">
                <div className="dashboard-panel-header flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Status updates and events</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-teal-600 -mr-2"
                        onClick={() => router.push("/dashboard/activity")}
                    >
                        View all
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
                <div className="dashboard-panel-body">
                    {loadingActivity ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : activity.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No recent activity</p>
                            <p className="text-xs mt-1">Updates will appear here</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[320px] pr-2">
                            <ul className="space-y-2">
                                {activity.map((item, index) => (
                                    <li key={item.id || index}>
                                        <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <div className="mt-0.5">{getActivityIcon(item.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-slate-500"> — {item.action}</span>
                                                </p>
                                                {item.treatment_type && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{item.treatment_type}</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {item.time}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    )
}
