"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, MessageCircle, Loader2, Calendar, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/fetch-client"
import { buildReminderMessage, getWhatsAppReminderUrl } from "@/lib/whatsapp-reminder"
import { toast } from "sonner"

interface ReminderItem {
    id: string
    patient: string
    patientPhone: string | null
    date: string
    time: string
    treatment: string
    dentist: string
    dateCategory: "today" | "in_2_days" | "in_7_days"
    startTime: string
}

interface UpcomingRemindersData {
    reminders: ReminderItem[]
    clinic: {
        name: string
        phone: string | null
    }
}

export function DashboardUpcomingReminders({ refreshKey = 0 }: { refreshKey?: number }) {
    const [data, setData] = useState<UpcomingRemindersData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                setLoading(true)
                const res = await fetchWithAuth("/api/dashboard/upcoming-reminders")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (e) {
                console.error("Error fetching upcoming reminders:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchReminders()
    }, [refreshKey])

    const handleCall = (phone: string | null) => {
        if (phone) {
            window.location.href = `tel:${phone}`
        }
    }

    const handleWhatsApp = (reminder: ReminderItem) => {
        if (!reminder.patientPhone) return
        
        const message = buildReminderMessage(
            reminder.patient,
            data?.clinic.name || "Your Clinic",
            reminder.treatment,
            reminder.dentist,
            reminder.date,
            reminder.time,
            data?.clinic.phone || null
        )
        
        const url = getWhatsAppReminderUrl(reminder.patientPhone, message)
        if (!url) {
            toast.error("Invalid phone number format")
            return
        }
        
        window.open(url, "_blank")
        toast.success("WhatsApp opening with reminder message")
    }

    const reminders = data?.reminders || []
    const groupedReminders = {
        today: reminders.filter((r) => r.dateCategory === "today"),
        in_2_days: reminders.filter((r) => r.dateCategory === "in_2_days"),
        in_7_days: reminders.filter((r) => r.dateCategory === "in_7_days"),
    }

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case "today":
                return "Today"
            case "in_2_days":
                return "In 2 days"
            case "in_7_days":
                return "In 7 days"
            default:
                return category
        }
    }

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Send appointment reminders</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Call or WhatsApp patients about upcoming appointments</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-teal-600 -mr-2"
                    onClick={() => router.push("/calendar")}
                >
                    View calendar
                    <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden />
                </Button>
            </div>
            <div className="dashboard-panel-body">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden />
                        <p className="text-sm font-medium">No upcoming appointments</p>
                        <p className="text-xs mt-1">No reminders needed in the next 7 days</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Group by date category */}
                        {(["today", "in_2_days", "in_7_days"] as const).map((category) => {
                            const categoryReminders = groupedReminders[category]
                            if (categoryReminders.length === 0) return null

                            return (
                                <div key={category} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">
                                        {getCategoryLabel(category)}
                                    </h4>
                                    {/* Mobile: card list */}
                                    <div className="md:hidden space-y-2">
                                        {categoryReminders.slice(0, 10).map((reminder) => (
                                            <div
                                                key={reminder.id}
                                                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {reminder.patient}
                                                    </p>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {reminder.date} · {reminder.time}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                        {reminder.treatment} · {reminder.dentist}
                                                    </p>
                                                    {reminder.patientPhone ? (
                                                        <p className="text-xs text-slate-400 mt-1">{reminder.patientPhone}</p>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 mt-1 italic">No phone number</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleCall(reminder.patientPhone)}
                                                        disabled={!reminder.patientPhone}
                                                        title={reminder.patientPhone ? `Call ${reminder.patient}` : "No phone number"}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => handleWhatsApp(reminder)}
                                                        disabled={!reminder.patientPhone}
                                                        title={reminder.patientPhone ? `Send WhatsApp to ${reminder.patient}` : "No phone number"}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Desktop: table */}
                                    <div className="hidden md:block overflow-x-auto -mx-1">
                                        <table className="w-full border-collapse" role="table">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Patient
                                                    </th>
                                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Date & Time
                                                    </th>
                                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Treatment
                                                    </th>
                                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Dentist
                                                    </th>
                                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Phone
                                                    </th>
                                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-2">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categoryReminders.slice(0, 15).map((reminder) => (
                                                    <tr
                                                        key={reminder.id}
                                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                                    >
                                                        <td className="py-2.5 px-2">
                                                            <span className="text-sm font-medium text-slate-900">
                                                                {reminder.patient}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            <span className="text-sm text-slate-600">
                                                                {reminder.date}
                                                            </span>
                                                            <br />
                                                            <span className="text-xs text-slate-500">{reminder.time}</span>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-sm text-slate-600 truncate max-w-[140px]">
                                                            {reminder.treatment}
                                                        </td>
                                                        <td className="py-2.5 px-2 text-sm text-slate-600 truncate max-w-[120px]">
                                                            {reminder.dentist}
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            {reminder.patientPhone ? (
                                                                <span className="text-xs text-slate-600">{reminder.patientPhone}</span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">No phone</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={() => handleCall(reminder.patientPhone)}
                                                                    disabled={!reminder.patientPhone}
                                                                    title={reminder.patientPhone ? `Call ${reminder.patient}` : "No phone number"}
                                                                >
                                                                    <Phone className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700"
                                                                    onClick={() => handleWhatsApp(reminder)}
                                                                    disabled={!reminder.patientPhone}
                                                                    title={reminder.patientPhone ? `Send WhatsApp to ${reminder.patient}` : "No phone number"}
                                                                >
                                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
