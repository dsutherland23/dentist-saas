"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, Loader2 } from "lucide-react"
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

export function DashboardOverviewAppointments({ refreshKey = 0 }: { refreshKey?: number }) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true)
                const res = await fetchWithAuth("/api/dashboard/schedule")
                if (res.ok) {
                    const data = await res.json()
                    setSchedule(data.schedule || [])
                }
            } catch (e) {
                console.error("Error fetching schedule:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchSchedule()
    }, [refreshKey])

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-slate-100 text-slate-700"
            case "checked_in":
            case "in_treatment":
                return "bg-emerald-50 text-emerald-700"
            case "scheduled":
            case "confirmed":
            case "pending":
            case "unconfirmed":
                return "bg-amber-50 text-amber-700"
            case "cancelled":
            case "no_show":
                return "bg-rose-50 text-rose-700"
            default:
                return "bg-slate-100 text-slate-600"
        }
    }

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Upcoming appointments</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Today&apos;s schedule</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-teal-600 -mr-2"
                    onClick={() => router.push("/calendar?openAll=true")}
                >
                    View all
                    <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden />
                </Button>
            </div>
            <div className="dashboard-panel-body">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
                    </div>
                ) : schedule.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden />
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
                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full min-w-[360px] border-collapse" role="table" aria-label="Upcoming appointments">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">
                                        Time
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">
                                        Patient
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">
                                        Treatment
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-2">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.slice(0, 8).map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <span className="text-sm font-medium text-slate-900 tabular-nums">
                                                {item.time}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2">
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-slate-900 hover:text-teal-600 text-left truncate max-w-[120px] block"
                                                onClick={() => router.push(`/calendar?appointmentId=${item.id}`)}
                                            >
                                                {item.patient}
                                            </button>
                                        </td>
                                        <td className="py-3 px-2 text-sm text-slate-600 truncate max-w-[140px]">
                                            {item.treatment}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
                                            >
                                                {getAppointmentStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
