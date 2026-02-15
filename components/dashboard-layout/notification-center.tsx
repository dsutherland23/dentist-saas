"use client"

import { useEffect, useState } from "react"
import { Bell, Clock, Check, Trash2, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Simple polling for now
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
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

    const getIcon = (type: string) => {
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
            case 'time_off_requested':
            case 'referral_received':
            case 'referral_intake_submitted':
            case 'appointment_assigned':
            case 'appointment_cancelled':
            case 'appointment_rescheduled':
            case 'staff_invited':
            case 'new_message':
            default:
                return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-all">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse-glow">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 backdrop-blur-xl bg-white/95 border-slate-200/50">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{unreadCount} new</span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                    {isLoading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-teal-50/30' : ''}`}
                                onClick={() => {
                                    markAsRead(notification.id)
                                    if (notification.link) router.push(notification.link)
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{getIcon(notification.type)}</div>
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
                                        <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5" />
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No notifications yet
                        </div>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                    <Button variant="ghost" className="w-full text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                        View all activity
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
