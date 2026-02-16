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
import { Phone, Clock, Check } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetch-client"
import { toast } from "sonner"

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
    const [confirmingId, setConfirmingId] = useState<string | null>(null)

    const markDismissed = useCallback((ids: string[]) => {
        const existing = JSON.parse(
            sessionStorage.getItem(DISMISSED_KEY) || "[]"
        ) as string[]
        sessionStorage.setItem(
            DISMISSED_KEY,
            JSON.stringify([...new Set([...existing, ...ids])])
        )
    }, [])

    const fetchReminders = useCallback(async () => {
        try {
            const res = await fetchWithAuth("/api/dashboard/reminders")
            if (!res.ok) return
            const data = await res.json()
            const list = data.reminders || []
            if (list.length === 0) return

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

    // Close only via (X), Dismiss, or after Confirm - not on Escape or click-outside
    const handleDismiss = () => {
        markDismissed(reminders.map((r) => r.id))
        setOpen(false)
        setReminders([])
    }

    const handleConfirm = async (id: string) => {
        setConfirmingId(id)
        try {
            const res = await fetchWithAuth(`/api/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "confirmed" }),
            })
            if (!res.ok) throw new Error("Failed to confirm")
            markDismissed([id])
            setReminders((prev) => {
                const next = prev.filter((r) => r.id !== id)
                if (next.length === 0) setOpen(false)
                return next
            })
            toast.success("Appointment confirmed")
        } catch {
            toast.error("Failed to confirm appointment")
        } finally {
            setConfirmingId(null)
        }
    }

    const handleCall = (phone: string | null) => {
        if (phone) {
            window.location.href = `tel:${phone}`
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleDismiss()
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
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
                            className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
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
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => handleCall(r.phone)}
                                    disabled={!r.phone}
                                    title={r.phone ? `Call ${r.patient}` : "No phone number"}
                                >
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleConfirm(r.id)}
                                    disabled={confirmingId === r.id}
                                    title="Mark as confirmed after call"
                                >
                                    {confirmingId === r.id ? (
                                        <span className="animate-pulse">…</span>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-1" />
                                            Confirm
                                        </>
                                    )}
                                </Button>
                            </div>
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
