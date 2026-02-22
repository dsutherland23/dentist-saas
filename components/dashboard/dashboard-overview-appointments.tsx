"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, Loader2, Mail, MapPin, User, Cake, CalendarPlus, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { fetchWithAuth } from "@/lib/fetch-client"
import { format } from "date-fns"

interface PatientDetails {
    email: string | null
    address: string | null
    gender: string | null
    date_of_birth: string | null
    age: string | null
    created_at: string | null
    note: string | null
}

interface ScheduleItem {
    id: string
    time: string
    patient: string
    treatment: string
    status: string
    type: string
    patient_id?: string
    patient_details?: PatientDetails | null
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

    const [hoveredItem, setHoveredItem] = useState<{ item: ScheduleItem; left: number; top: number } | null>(null)
    const hoverOpenRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hoverCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handlePatientMouseEnter = (item: ScheduleItem, e: React.MouseEvent) => {
        if (hoverCloseRef.current) {
            clearTimeout(hoverCloseRef.current)
            hoverCloseRef.current = null
        }
        const el = e.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        hoverOpenRef.current = setTimeout(() => {
            setHoveredItem({
                item,
                left: rect.left,
                top: rect.bottom + 4,
            })
        }, 350)
    }
    const handlePatientMouseLeave = () => {
        if (hoverOpenRef.current) {
            clearTimeout(hoverOpenRef.current)
            hoverOpenRef.current = null
        }
        hoverCloseRef.current = setTimeout(() => setHoveredItem(null), 180)
    }

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
                    <>
                        {/* Mobile / small: compact card list — time and name never overlap */}
                        <div className="md:hidden space-y-2">
                            {schedule.slice(0, 8).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => router.push(`/calendar?appointmentId=${item.id}`)}
                                    className="w-full text-left flex items-start sm:items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/80 hover:border-slate-200 transition-colors"
                                >
                                    <span className="shrink-0 min-w-[5.5rem] max-w-[5.5rem] text-xs font-semibold text-slate-700 tabular-nums break-words text-left">
                                        {item.time}
                                    </span>
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{item.patient}</p>
                                        <p className="text-xs text-slate-500 truncate">{item.treatment}</p>
                                    </div>
                                    <span
                                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusBadgeClass(item.status)}`}
                                    >
                                        {getAppointmentStatusLabel(item.status)}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {/* Desktop: table */}
                        <div className="hidden md:block overflow-x-auto -mx-1">
                            <table className="w-full border-collapse" role="table" aria-label="Upcoming appointments">
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
                                                <span className="text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">
                                                    {item.time}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div
                                                    className="relative inline-block max-w-[120px]"
                                                    onMouseEnter={(e) => handlePatientMouseEnter(item, e)}
                                                    onMouseLeave={handlePatientMouseLeave}
                                                >
                                                    <button
                                                        type="button"
                                                        className="text-sm font-medium text-slate-900 hover:text-teal-600 text-left truncate max-w-[120px] block w-full"
                                                        onClick={() => router.push(`/calendar?appointmentId=${item.id}`)}
                                                    >
                                                        {item.patient}
                                                    </button>
                                                </div>
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
                    </>
                )}
            </div>

            {/* Patient info card — rendered in portal so it surfaces above the panel */}
            {typeof document !== "undefined" &&
                hoveredItem?.item.patient_details &&
                createPortal(
                    <div
                        className="fixed z-[9999] w-[320px] rounded-lg border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-900/10"
                        style={{
                            left: Math.min(hoveredItem.left, typeof window !== "undefined" ? window.innerWidth - 336 : hoveredItem.left),
                            top: hoveredItem.top,
                        }}
                        onMouseEnter={() => {
                            if (hoverCloseRef.current) {
                                clearTimeout(hoverCloseRef.current)
                                hoverCloseRef.current = null
                            }
                        }}
                        onMouseLeave={handlePatientMouseLeave}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Patient info</p>
                        <dl className="space-y-2.5 text-sm">
                            <div className="flex gap-2.5">
                                <Mail className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Email</dt>
                                    <dd className="font-medium text-slate-900 truncate">{hoveredItem.item.patient_details.email || "—"}</dd>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Address</dt>
                                    <dd className="font-medium text-slate-900 line-clamp-2">{hoveredItem.item.patient_details.address || "—"}</dd>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <User className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Gender</dt>
                                    <dd className="font-medium text-slate-900">{hoveredItem.item.patient_details.gender || "—"}</dd>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <Cake className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Birthday / Age</dt>
                                    <dd className="font-medium text-slate-900">
                                        {hoveredItem.item.patient_details.date_of_birth
                                            ? `${format(new Date(hoveredItem.item.patient_details.date_of_birth), "MMM d, yyyy")}${hoveredItem.item.patient_details.age ? ` · ${hoveredItem.item.patient_details.age}` : ""}`
                                            : "—"}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <CalendarPlus className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Date added</dt>
                                    <dd className="font-medium text-slate-900">
                                        {hoveredItem.item.patient_details.created_at ? format(new Date(hoveredItem.item.patient_details.created_at), "MMM d, yyyy") : "—"}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <dt className="text-slate-500">Note</dt>
                                    <dd className="font-medium text-slate-900 line-clamp-2">{hoveredItem.item.patient_details.note || "—"}</dd>
                                </div>
                            </div>
                        </dl>
                    </div>,
                    document.body
                )}
        </div>
    )
}
