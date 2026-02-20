"use client"

import { useEffect, useState } from "react"
import { Bell, Clock, Loader2, Info, CheckCircle2, AlertCircle, Phone, MessageCircle, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/fetch-client"
import { buildReminderMessage, getWhatsAppReminderUrl } from "@/lib/whatsapp-reminder"
import { toast } from "sonner"

interface AlertItem {
    type: string
    severity: 'high' | 'medium' | 'low'
    message: string
    count?: number
}

interface ReminderItem {
    id: string
    patient: string
    patientPhone: string | null
    date: string
    time: string
    treatment: string
    dentist: string
    dateCategory: "today" | "in_2_days" | "in_7_days"
}

interface UpcomingRemindersData {
    reminders: ReminderItem[]
    clinic: {
        name: string
        phone: string | null
    }
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(true)
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
    const [remindersData, setRemindersData] = useState<UpcomingRemindersData | null>(null)
    const [isLoadingReminders, setIsLoadingReminders] = useState(true)
    const router = useRouter()

    const fetchNotifications = async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/notifications', { signal })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            const e = error as Error
            if (e.name !== 'AbortError' && e.message !== 'Failed to fetch') {
                console.error("Error fetching notifications:", error)
            }
        } finally {
            setIsLoadingNotifs(false)
        }
    }

    const fetchAlerts = async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/dashboard/insurance-panel', { signal })
            if (res.ok) {
                const data = await res.json()
                setAlerts(data.alerts ?? [])
            }
        } catch (error) {
            const e = error as Error
            if (e.name !== 'AbortError' && e.message !== 'Failed to fetch') {
                console.error("Error fetching alerts:", error)
            }
        } finally {
            setIsLoadingAlerts(false)
        }
    }

    const fetchReminders = async (signal?: AbortSignal) => {
        try {
            setIsLoadingReminders(true)
            const res = await fetchWithAuth("/api/dashboard/upcoming-reminders", { signal })
            if (res.ok) {
                const data = await res.json()
                setRemindersData(data)
            }
        } catch (error) {
            const e = error as Error
            if (e.name !== "AbortError" && e.message !== "Failed to fetch") {
                console.error("Error fetching reminders:", error)
            }
        } finally {
            setIsLoadingReminders(false)
        }
    }

    useEffect(() => {
        const ac = new AbortController()
        fetchNotifications(ac.signal)
        fetchAlerts(ac.signal)
        fetchReminders(ac.signal)
        const interval = setInterval(() => {
            fetchNotifications()
            fetchAlerts()
            fetchReminders()
        }, 30000)
        return () => {
            clearInterval(interval)
            ac.abort()
        }
    }, [])

    const handleCall = (phone: string | null) => {
        if (phone) {
            window.location.href = `tel:${phone}`
        }
    }

    const handleWhatsApp = (reminder: ReminderItem) => {
        if (!reminder.patientPhone) return

        const message = buildReminderMessage(
            reminder.patient,
            remindersData?.clinic.name || "Your Clinic",
            reminder.treatment,
            reminder.dentist,
            reminder.date,
            reminder.time,
            remindersData?.clinic.phone || null
        )

        const url = getWhatsAppReminderUrl(reminder.patientPhone, message)
        if (!url) {
            toast.error("Invalid phone number format")
            return
        }

        window.open(url, "_blank")
        toast.success("WhatsApp opening with reminder message")
    }

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_read: true })
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            }
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length
    const alertCount = alerts.length
    const reminders = remindersData?.reminders ?? []
    const reminderCount = reminders.length
    const totalBadge = unreadCount + alertCount + reminderCount

    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'success':
            case 'time_off_approved':
            case 'time_off_granted':
            case 'referral_status_updated':
            case 'staff_joined':
            case 'invoice_paid':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'warning':
            case 'time_off_rejected':
            case 'invoice_overdue':
                return <AlertCircle className="h-4 w-4 text-amber-500" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-rose-500" />
            default:
                return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const getAlertIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            case 'medium':
                return <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            default:
                return <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
        }
    }

    const getAlertBg = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-rose-50 border-rose-200'
            case 'medium':
                return 'bg-amber-50 border-amber-200'
            default:
                return 'bg-blue-50 border-blue-200'
        }
    }

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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-all">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {totalBadge > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse-glow min-w-4">
                            {totalBadge > 99 ? '99+' : totalBadge}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 backdrop-blur-xl bg-white/95 border-slate-200/50">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Notifications & Alerts</span>
                    {totalBadge > 0 && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {unreadCount > 0 && `${unreadCount} new`}
                            {unreadCount > 0 && alertCount > 0 && ' · '}
                            {alertCount > 0 && `${alertCount} alert${alertCount !== 1 ? 's' : ''}`}
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
                    {/* Alerts section */}
                    {alerts.length > 0 && (
                        <>
                            <div className="px-3 pt-2 pb-1">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alerts</p>
                            </div>
                            <div className="space-y-2 px-2 pb-3">
                                {alerts.map((alert, index) => (
                                    <div
                                        key={`alert-${index}-${alert.type}`}
                                        className={`p-3 rounded-lg border ${getAlertBg(alert.severity)}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">{getAlertIcon(alert.severity)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                                                {alert.count != null && alert.count > 1 && (
                                                    <p className="text-xs text-slate-500 mt-0.5">Count: {alert.count}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Reminders section */}
                    <div className="px-3 pt-2 pb-1">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reminders</p>
                    </div>
                    {isLoadingReminders ? (
                        <div className="px-3 pb-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                                Checking upcoming appointments…
                            </div>
                        </div>
                    ) : reminders.length > 0 ? (
                        <div className="space-y-2 px-2 pb-3">
                            {(["today", "in_2_days", "in_7_days"] as const).map((category) => {
                                const categoryReminders = groupedReminders[category]
                                if (categoryReminders.length === 0) return null

                                return (
                                    <div key={category} className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 px-1">
                                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {getCategoryLabel(category)}
                                            </p>
                                        </div>
                                        {categoryReminders.slice(0, 3).map((reminder) => (
                                            <div
                                                key={reminder.id}
                                                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-slate-900 truncate">
                                                            {reminder.patient}
                                                        </p>
                                                        <p className="text-[11px] text-slate-600">
                                                            {reminder.date} · {reminder.time}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 truncate">
                                                            {reminder.treatment} · {reminder.dentist}
                                                        </p>
                                                        {reminder.patientPhone ? (
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                {reminder.patientPhone}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[11px] text-slate-400 mt-0.5 italic">
                                                                No phone number
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 shrink-0 items-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => handleCall(reminder.patientPhone)}
                                                                disabled={!reminder.patientPhone}
                                                                title={reminder.patientPhone ? `Call ${reminder.patient}` : "No phone number"}
                                                            >
                                                                <Phone className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700"
                                                                onClick={() => handleWhatsApp(reminder)}
                                                                disabled={!reminder.patientPhone}
                                                                title={reminder.patientPhone ? `Send WhatsApp to ${reminder.patient}` : "No phone number"}
                                                            >
                                                                <MessageCircle className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="px-3 pb-3 text-[11px] text-slate-500">
                            No upcoming appointments that need reminders in the next 7 days.
                        </div>
                    )}
                    <DropdownMenuSeparator />

                    {/* Notifications section */}
                    <div className="px-3 pt-2 pb-1">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notifications</p>
                    </div>
                    {isLoadingNotifs ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="pb-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-teal-50/30' : ''}`}
                                    onClick={() => {
                                        markAsRead(notification.id)
                                        if (notification.link) router.push(notification.link)
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">{getNotifIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.is_read ? 'font-bold' : 'font-medium'} text-slate-900 truncate`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">
                            No notifications yet
                        </div>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        className="w-full text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => router.push('/dashboard')}
                    >
                        View dashboard
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
