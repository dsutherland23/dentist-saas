"use client"

import { useEffect, useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Clock, CalendarCheck } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetch-client"

const REMINDER_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const DISMISSED_KEY = "appointment-reminders-dismissed"

interface Reminder {
    id: string
    time: string
    patient: string
    phone: string | null
    treatment: string
    status: string
}

export function AppointmentReminderModal() {
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const fetchReminders = useCallback(async () => {
        try {
            const res = await fetchWithAuth("/api/dashboard/reminders")
            if (!res.ok) return
            const data = await res.json()
            const list = data.reminders || []
            if (list.length === 0) return

            // Don't show if user dismissed these same appointments recently
            const dismissed = JSON.parse(
                sessionStorage.getItem(DISMISSED_KEY) || "[]"
            ) as string[]
            const toShow = list.filter((r: Reminder) => !dismissed.includes(r.id))
            if (toShow.length === 0) return

            setReminders(toShow)
            setOpen(true)
        } catch {
            // Silently ignore fetch errors
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        fetchReminders()

        const interval = setInterval(() => {
            setLoading(true)
            fetchReminders()
        }, REMINDER_CHECK_INTERVAL)

        return () => clearInterval(interval)
    }, [fetchReminders])

    const handleDismiss = () => {
        const ids = reminders.map((r) => r.id)
        const existing = JSON.parse(
            sessionStorage.getItem(DISMISSED_KEY) || "[]"
        ) as string[]
        sessionStorage.setItem(
            DISMISSED_KEY,
            JSON.stringify([...new Set([...existing, ...ids])])
        )
        setOpen(false)
        setReminders([])
    }

    const handleCall = (phone: string | null) => {
        if (phone) {
            window.location.href = `tel:${phone}`
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <DialogTitle>Appointment reminders</DialogTitle>
                            <DialogDescription>
                                These appointments start in the next 2 hours. Call to confirm.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {reminders.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-teal-700 shrink-0">
                                    <Clock className="h-4 w-4" />
                                    {r.time}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                        {r.patient}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {r.treatment}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="shrink-0 bg-teal-600 hover:bg-teal-700"
                                onClick={() => handleCall(r.phone)}
                                disabled={!r.phone}
                                title={r.phone ? `Call ${r.patient}` : "No phone number"}
                            >
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                            </Button>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleDismiss}>
                        Dismiss
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
