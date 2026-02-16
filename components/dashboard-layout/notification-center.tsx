"use client"

import { useEffect, useState } from "react"
import { Bell, Clock, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react"
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

interface AlertItem {
    type: string
    severity: 'high' | 'medium' | 'low'
    message: string
    count?: number
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(true)
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
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

    useEffect(() => {
        const ac = new AbortController()
        fetchNotifications(ac.signal)
        fetchAlerts(ac.signal)
        const interval = setInterval(() => {
            fetchNotifications()
            fetchAlerts()
        }, 30000)
        return () => {
            clearInterval(interval)
            ac.abort()
        }
    }, [])

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
    const totalBadge = unreadCount + alertCount

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
                <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
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
