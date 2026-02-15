"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import {
    format,
    addDays,
    addWeeks,
    addMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    setHours,
    parseISO,
    startOfDay
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Loader2, Activity, Ban, Unlock, Phone, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NewAppointmentDialog } from "./new-appointment-dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { rescheduleAppointment } from "./actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { differenceInMinutes, addMinutes, isAfter } from "date-fns"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { useRouter } from "next/navigation"
import { QueueReceiptDialog, type QueueReceiptData } from "@/components/calendar/queue-receipt-dialog"

interface Appointment {
    id: string
    title?: string
    start_time: string
    end_time: string
    treatment_type: string
    status: string
    patient_id: string
    dentist_id: string
    checked_in_at?: string | null
    checked_out_at?: string | null
    patients?: { first_name: string, last_name: string; phone?: string | null }
    dentists?: { first_name: string, last_name: string }
}

interface BlockedSlot {
    id: string
    staff_id: string
    start_time: string
    end_time: string
    reason?: string | null
}

interface CalendarClientProps {
    initialAppointments: Appointment[]
    initialBlockedSlots?: BlockedSlot[]
    patients: { id: string; first_name: string; last_name: string }[]
    dentists: { id: string; first_name: string; last_name: string }[]
    clinic?: { name: string; logo_url?: string | null; phone?: string | null; website?: string | null } | null
}

export default function CalendarClient({ initialAppointments, initialBlockedSlots = [], patients, dentists, clinic }: CalendarClientProps) {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<"day" | "week" | "month" | "staff">("week")
    const [staffFilterId, setStaffFilterId] = useState<string | null>(null)
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
    const [pendingReschedule, setPendingReschedule] = useState<{
        appointment: any,
        newStart: Date,
        newEnd: Date,
        conflictPatient?: string | null
    } | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [draggedOver, setDraggedOver] = useState<{ day: string; hour?: number } | null>(null)
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
    const [newAppointmentStart, setNewAppointmentStart] = useState<Date | undefined>(undefined)
    const [contextMenuBlock, setContextMenuBlock] = useState<{ id: string; dentistName: string } | null>(null)
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
    const [isUnblocking, setIsUnblocking] = useState(false)
    const [receiptData, setReceiptData] = useState<QueueReceiptData | null>(null)
    const [isReceiptOpen, setIsReceiptOpen] = useState(false)

    const closeContextMenu = useCallback(() => setContextMenuBlock(null), [])

    useEffect(() => {
        if (!contextMenuBlock) return
        const handleClick = (e: MouseEvent) => {
            if ((e.target as HTMLElement)?.closest?.("[data-block-context-menu]")) return
            closeContextMenu()
        }
        const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && closeContextMenu()
        document.addEventListener("click", handleClick, true)
        document.addEventListener("keydown", handleEscape)
        return () => {
            document.removeEventListener("click", handleClick, true)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [contextMenuBlock, closeContextMenu])

    const handleUnblock = async (id: string) => {
        setIsUnblocking(true)
        try {
            const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to unblock")
            toast.success("Time slot unblocked")
            closeContextMenu()
            router.refresh()
        } catch {
            toast.error("Failed to unblock time slot")
        } finally {
            setIsUnblocking(false)
        }
    }

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        setUpdatingStatusId(appointmentId)
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((json as { error?: string })?.error || "Update failed")
            if (newStatus === "checked_in") {
                toast.success("Patient checked in")
                const d = json as {
                    queueNumber?: number
                    patients?: { first_name: string; last_name: string; date_of_birth?: string | null }
                    dentists?: { first_name: string; last_name: string }
                    start_time: string
                }
                if (typeof d?.queueNumber === "number") {
                    setReceiptData({
                        queueNumber: d.queueNumber,
                        patientName: d.patients
                            ? `${d.patients.first_name} ${d.patients.last_name}`
                            : "Unknown Patient",
                        dateOfBirth: d.patients?.date_of_birth ?? null,
                        doctorName: d.dentists
                            ? `Dr. ${d.dentists.last_name}`
                            : "Staff",
                        dateTime: format(parseISO(d.start_time), "EEEE, MMM d 'at' h:mm a"),
                    })
                    setIsReceiptOpen(true)
                }
            } else if (newStatus === "in_treatment") toast.success("Treatment started")
            else if (newStatus === "completed") toast.success("Appointment completed (checked out)")
            else toast.success("Status updated")
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update status")
        } finally {
            setUpdatingStatusId(null)
        }
    }

    const appointments = initialAppointments.map(appt => ({
        ...appt,
        start: parseISO(appt.start_time),
        end: parseISO(appt.end_time),
        patientName: appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown Patient",
        dentistName: appt.dentists ? `Dr. ${appt.dentists.last_name}` : "Unknown Dentist",
        patientPhone: appt.patients?.phone ?? null
    }))

    const blockedSlots = initialBlockedSlots.map(blk => ({
        ...blk,
        start: parseISO(blk.start_time),
        end: parseISO(blk.end_time),
        dentistName: dentists.find(d => d.id === blk.staff_id) ? `Dr. ${dentists.find(d => d.id === blk.staff_id)?.last_name}` : "Staff"
    }))

    const filteredDentists = staffFilterId
        ? dentists.filter(d => d.id === staffFilterId)
        : dentists
    const filteredAppointments = staffFilterId
        ? appointments.filter(a => a.dentist_id === staffFilterId)
        : appointments
    const filteredBlockedSlots = staffFilterId
        ? blockedSlots.filter(b => b.staff_id === staffFilterId)
        : blockedSlots

    // Dynamic date calculations based on view
    let startDate: Date, endDate: Date
    if (view === "day" || view === "staff") {
        startDate = startOfDay(currentDate)
        endDate = startOfDay(currentDate)
    } else if (view === "week") {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
    } else {
        startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    }

    const apptHours = filteredAppointments.map(a => a.start.getHours())
    const minHour = Math.min(7, ...apptHours.length ? apptHours : [8])
    const maxHour = Math.max(19, ...apptHours.length ? apptHours : [17])

    const days = view === "staff" ? [currentDate] : eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour)

    const nextPeriod = () => {
        if (view === "day" || view === "staff") setCurrentDate(current => addDays(current, 1))
        else if (view === "week") setCurrentDate(current => addWeeks(current, 1))
        else setCurrentDate(current => addMonths(current, 1))
    }

    const prevPeriod = () => {
        if (view === "day" || view === "staff") setCurrentDate(current => addDays(current, -1))
        else if (view === "week") setCurrentDate(current => addWeeks(current, -1))
        else setCurrentDate(current => addMonths(current, -1))
    }

    const today = () => {
        const now = new Date()
        setCurrentDate(now)
        setView("day") // Switching to day view on "Today" click provides better immediate focus
    }

    // Helper to format the period label
    const getPeriodLabel = () => {
        if (view === "day" || view === "staff") return format(currentDate, "MMMM d, yyyy")
        if (view === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            const end = endOfWeek(currentDate, { weekStartsOn: 1 })
            if (isSameMonth(start, end)) {
                return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`
            }
            return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        }
        return format(currentDate, "MMMM yyyy")
    }

    const BlockedSlotCard = ({ blk, isMonthView = false }: { blk: any; isMonthView?: boolean }) => {
        const blockClass = "text-[10px] px-2 py-1 rounded bg-slate-200/70 text-slate-500 font-medium border border-slate-300/60 cursor-context-menu opacity-90"
        const hoverTitle = blk.reason
            ? `${blk.dentistName} – ${blk.reason}`
            : `Blocked: ${blk.dentistName}`

        const onContextMenu = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setContextMenuBlock({ id: blk.id, dentistName: blk.dentistName })
            setContextMenuPos({ x: e.clientX, y: e.clientY })
        }

        return isMonthView ? (
            <div data-blocked onContextMenu={onContextMenu} className={cn(blockClass, "w-full truncate flex items-center gap-1")} title={hoverTitle}>
                <Ban className="h-3 w-3 shrink-0 opacity-70" />
                <span className="font-bold text-slate-500 uppercase text-[8px] shrink-0">{format(blk.start, "h a")}</span>
                <span className="truncate">{blk.dentistName} blocked</span>
            </div>
        ) : (
            <div
                data-blocked
                onContextMenu={onContextMenu}
                className={cn(blockClass, "absolute left-1 right-1 p-2 min-h-[36px] z-10 flex flex-col justify-center")}
                style={{
                    top: `${(blk.start.getMinutes() / 60) * 100}%`,
                    height: `${Math.max((blk.end.getTime() - blk.start.getTime()) / 60000 / 60 * 100, 35)}%`,
                }}
                title={hoverTitle}
            >
                <div className="truncate flex items-center gap-1">
                    <Ban className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="font-bold text-slate-500 uppercase text-[8px] shrink-0">{format(blk.start, "h a")}</span>
                    <span className="truncate">{blk.dentistName} blocked</span>
                </div>
            </div>
        )
    }

    const STATUS_DROPDOWN_OPTIONS = [
        { value: "pending", label: "Pending" },
        { value: "unconfirmed", label: "Unconfirmed" },
        { value: "confirmed", label: "Confirm" },
        { value: "checked_in", label: "Checked-In" },
        { value: "no_show", label: "No-Show" },
        { value: "cancelled", label: "Canceled" },
    ] as const
    const statusToDropdownValue = (s: string) => {
        if (["pending", "unconfirmed", "confirmed", "checked_in", "no_show", "cancelled"].includes(s)) return s
        if (s === "scheduled") return "pending" // awaiting arrival
        if (s === "in_treatment") return "checked_in"
        return "pending"
    }

    const AppointmentCard = ({ appt, isMonthView = false }: { appt: any, isMonthView?: boolean }) => {
        const now = new Date()
        const oneMinAfterStart = addMinutes(appt.start, 1)
        const showStatusDropdown = isAfter(now, oneMinAfterStart) && !["completed"].includes(appt.status)

        const colorIndex = dentists.findIndex(d => d.id === appt.dentist_id) % 5
        const colors = [
            "bg-teal-50 border-teal-200 text-teal-700",
            "bg-blue-50 border-blue-200 text-blue-700",
            "bg-purple-50 border-purple-200 text-purple-700",
            "bg-amber-50 border-amber-200 text-amber-700",
            "bg-rose-50 border-rose-200 text-rose-700"
        ]
        const colorClass = colors[colorIndex] || colors[0]

        const cardBaseClass = "text-[10px] px-2 py-1 rounded bg-slate-100/50 text-slate-700 font-medium border border-slate-200/50 cursor-grab active:cursor-grabbing hover:bg-slate-200/50 transition-colors"

        return (
            <Popover>
                <PopoverTrigger asChild>
                    {isMonthView ? (
                        <div
                            data-appointment
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("appointmentId", appt.id)
                                e.dataTransfer.effectAllowed = "move"
                            }}
                            className={cn(cardBaseClass, "w-full truncate")}
                        >
                            <span className="font-bold text-teal-600 uppercase text-[8px] mr-1 shrink-0">{format(appt.start, "h a")}</span>
                            <span className="truncate">{appt.patientName}</span>
                        </div>
                    ) : (
                        <div
                            data-appointment
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("appointmentId", appt.id)
                                e.dataTransfer.effectAllowed = "move"
                            }}
                            className={cn(cardBaseClass, "absolute left-1 right-1 p-2 z-20 group/appt overflow-hidden")}
                            style={{
                                top: `${(appt.start.getMinutes() / 60) * 100}%`,
                                height: `${Math.max((appt.end.getTime() - appt.start.getTime()) / 60000 / 60 * 100, 35)}%`,
                                minHeight: "36px"
                            }}
                        >
                            <div className="truncate flex items-center gap-1">
                                <span className="font-bold text-teal-600 uppercase text-[8px] shrink-0">{format(appt.start, "h a")}</span>
                                <span className="truncate">{appt.patientName}</span>
                            </div>
                            <div className="truncate pl-0 mt-0.5 opacity-80 text-[9px]">{appt.treatment_type}</div>
                        </div>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    data-appointment
                    className="w-80 p-0 overflow-hidden border-slate-200 shadow-xl"
                    side="right"
                    align="start"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className={cn("p-4 border-b", colorClass.split(" ")[0])}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-white/50 text-current font-bold uppercase">
                                    {appt.patientName.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="font-bold text-slate-900">{appt.patientName}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Patient Record</p>
                                {appt.patientPhone && (
                                    <a href={`tel:${appt.patientPhone}`} className="mt-1 flex items-center gap-1 text-[11px] text-slate-600 hover:text-teal-600 hover:underline">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        {appt.patientPhone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Treatment</p>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                                    <span className="text-sm font-semibold text-slate-700">{appt.treatment_type}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Dentist</p>
                                <div className="flex items-center gap-2">
                                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-700">{appt.dentistName}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">
                                    {format(appt.start, "h:mm a")} – {format(appt.end, "h:mm a")}
                                </span>
                            </div>
                            {showStatusDropdown ? (
                                <Select
                                    value={statusToDropdownValue(appt.status)}
                                    onValueChange={(v) => handleStatusChange(appt.id, v)}
                                    disabled={updatingStatusId === appt.id}
                                >
                                    <SelectTrigger className="h-7 w-[100px] text-[9px] font-bold uppercase tracking-tighter px-2 py-0 border-slate-200">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_DROPDOWN_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value} className="text-[11px] font-medium">
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[9px] uppercase tracking-tighter font-bold",
                                        (appt.status === "checked_in" || appt.status === "in_treatment")
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : appt.status === "completed"
                                                ? "bg-slate-100 border-slate-200 text-slate-600"
                                                : "bg-slate-50 border-slate-200 text-slate-500"
                                    )}
                                >
                                    {getAppointmentStatusLabel(appt.status)}
                                </Badge>
                            )}
                        </div>
                        {(appt.checked_in_at || appt.checked_out_at) && (
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                                {appt.checked_in_at && (
                                    <p className="flex items-center gap-1.5">
                                        <span className="font-semibold text-emerald-600">In:</span>
                                        {format(parseISO(appt.checked_in_at), "h:mm a")}
                                    </p>
                                )}
                                {appt.checked_out_at && (
                                    <p className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-600">Out:</span>
                                        {format(parseISO(appt.checked_out_at), "h:mm a")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold">Reschedule</Button>
                        {appt.status !== "completed" && appt.status !== "cancelled" && appt.status !== "checked_in" && appt.status !== "in_treatment" && (
                            <Button
                                className="h-8 text-[11px] font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-60"
                                disabled={updatingStatusId === appt.id}
                                onClick={() => handleStatusChange(appt.id, "checked_in")}
                            >
                                {updatingStatusId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check In"}
                            </Button>
                        )}
                        {appt.status === "checked_in" && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px] font-bold border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                                disabled={updatingStatusId === appt.id}
                                onClick={() => handleStatusChange(appt.id, "in_treatment")}
                            >
                                {updatingStatusId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Start treatment"}
                            </Button>
                        )}
                        {(appt.status === "checked_in" || appt.status === "in_treatment") && (
                            <Button
                                className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                                disabled={updatingStatusId === appt.id}
                                onClick={() => handleStatusChange(appt.id, "completed")}
                            >
                                {updatingStatusId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Complete / Check out"}
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    const handleDrop = (day: Date, hour?: number) => (e: React.DragEvent) => {
        e.preventDefault()
        const appointmentId = e.dataTransfer.getData("appointmentId")
        const appt = appointments.find(a => a.id === appointmentId)

        if (!appt) return

        let newStart, newEnd
        const duration = differenceInMinutes(appt.end, appt.start)

        if (hour !== undefined) {
            // Day/Week view: specific hour
            newStart = setHours(startOfDay(day), hour)
            newStart = addMinutes(newStart, appt.start.getMinutes())
            newEnd = addMinutes(newStart, duration)
        } else {
            // Month view: keep original time, change day
            newStart = setHours(startOfDay(day), appt.start.getHours())
            newStart = addMinutes(newStart, appt.start.getMinutes())
            newEnd = addMinutes(newStart, duration)
        }

        // Don't do anything if it's the same time
        if (appt.start.getTime() === newStart.getTime()) return

        // Conflict detection (same dentist)
        const conflict = appointments.find(a =>
            a.id !== appt.id &&
            a.dentist_id === appt.dentist_id &&
            (
                (newStart >= a.start && newStart < a.end) ||
                (newEnd > a.start && newEnd <= a.end) ||
                (newStart <= a.start && newEnd >= a.end)
            )
        )

        setPendingReschedule({
            appointment: appt,
            newStart,
            newEnd,
            conflictPatient: conflict ? conflict.patientName : null
        })
        setIsRescheduleOpen(true)
        setDraggedOver(null)
    }

    const handleDragOver = (day: Date, hour?: number) => (e: React.DragEvent) => {
        e.preventDefault()
        if (draggedOver?.day !== day.toISOString() || draggedOver?.hour !== hour) {
            setDraggedOver({ day: day.toISOString(), hour })
        }
    }

    const handleDragLeave = (day: Date, hour?: number) => (e: React.DragEvent) => {
        e.preventDefault()
        // Use a small delay or check currentTarget to avoid child-triggered flickering
        if (draggedOver?.day === day.toISOString() && draggedOver?.hour === hour) {
            setDraggedOver(null)
        }
    }

    const confirmReschedule = async () => {
        if (!pendingReschedule) return

        setIsUpdating(true)
        try {
            const result = await rescheduleAppointment(
                pendingReschedule.appointment.id,
                pendingReschedule.newStart,
                pendingReschedule.newEnd
            )

            if (result.success) {
                toast.success("Appointment rescheduled successfully")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to reschedule appointment")
        } finally {
            setIsUpdating(false)
            setIsRescheduleOpen(false)
            setPendingReschedule(null)
        }
    }

    return (
        <div className="flex flex-col min-h-[400px] h-[calc(100vh-8rem)] sm:h-[calc(100vh-100px)] bg-slate-50 p-3 sm:p-4 md:p-6 max-w-full w-full min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 shrink-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 truncate">
                        {getPeriodLabel()}
                    </h2>
                    <div className="flex items-center rounded-md border bg-white shadow-sm overflow-hidden border-slate-200">
                        <Button variant="ghost" size="icon" onClick={prevPeriod} className="rounded-none border-r border-slate-100 h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" onClick={today} className="px-2 sm:px-4 font-bold rounded-none border-r border-slate-100 h-8 sm:h-9 text-xs uppercase tracking-wider hover:bg-slate-50 hover:text-teal-600 transition-colors">Today</Button>
                        <Button variant="ghost" size="icon" onClick={nextPeriod} className="rounded-none h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Select value={staffFilterId ?? "all"} onValueChange={(v) => setStaffFilterId(v === "all" ? null : v)}>
                        <SelectTrigger className="w-[140px] sm:w-[160px] h-8 sm:h-9 text-xs border-slate-200 bg-white">
                            <Users className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
                            <SelectValue placeholder="All staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All staff</SelectItem>
                            {dentists.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                    Dr. {d.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(["day", "week", "staff", "month"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all capitalize",
                                    view === v ? "bg-white shadow-sm text-teal-600" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {v === "staff" ? "By staff" : v}
                            </button>
                        ))}
                    </div>
                    <NewAppointmentDialog
                        patients={patients}
                        dentists={dentists}
                        trigger={
                            <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm shrink-0"
                                onClick={() => {
                                    setNewAppointmentStart(undefined)
                                    setIsNewAppointmentOpen(true)
                                }}
                            >
                                <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Appointment
                            </Button>
                        }
                        open={isNewAppointmentOpen}
                        onOpenChange={(o) => {
                            setIsNewAppointmentOpen(o)
                            if (!o) setNewAppointmentStart(undefined)
                        }}
                        initialStartDate={newAppointmentStart}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col border-slate-200">
                {view === "staff" ? (
                    /* Staff view: one day, one column per dentist – see who is scheduled at a glance */
                    <>
                        <div className="overflow-x-auto overflow-y-hidden border-b border-slate-100 shrink-0">
                            <div
                                className="grid border-b border-slate-100 min-w-0"
                                style={{ gridTemplateColumns: `70px repeat(${filteredDentists.length}, minmax(120px, 1fr))` }}
                            >
                                <div className="p-2 sm:p-4 bg-slate-50/50 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center border-r border-slate-100 shrink-0">
                                    TIME
                                </div>
                                {filteredDentists.map((d) => (
                                    <div key={d.id} className="p-2 sm:p-4 border-r border-slate-100 text-center flex flex-col items-center justify-center gap-0.5 min-w-0 bg-slate-50/30">
                                        <span className="text-[10px] font-bold text-slate-600 truncate w-full">Dr. {d.last_name}</span>
                                        <span className="text-[9px] text-slate-400">
                                            {filteredAppointments.filter(a => a.dentist_id === d.id && isSameDay(a.start, currentDate)).length} apps
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-thin min-h-0">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="grid h-14 sm:h-[80px] shrink-0"
                                    style={{ gridTemplateColumns: `70px repeat(${filteredDentists.length}, minmax(120px, 1fr))` }}
                                >
                                    <div className="border-r border-b border-slate-100 bg-slate-50/30 text-[9px] sm:text-[10px] text-slate-400 font-bold p-1 sm:p-2 text-center sticky left-0 bg-slate-50/30 z-[1] flex items-start justify-center pt-2 sm:pt-3 h-14 sm:h-[80px] shrink-0">
                                        {format(setHours(new Date(), hour), "h a")}
                                    </div>
                                    {filteredDentists.map((dentist) => {
                                        const day = currentDate
                                        const isOver = draggedOver?.day === day.toISOString() && draggedOver?.hour === hour
                                        return (
                                            <div
                                                key={dentist.id}
                                                onDragOver={handleDragOver(day, hour)}
                                                onDragLeave={handleDragLeave(day, hour)}
                                                onDrop={handleDrop(day, hour)}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest("[data-appointment]") || (e.target as HTMLElement).closest("[data-blocked]")) return
                                                    const slotStart = setHours(startOfDay(day), hour)
                                                    setNewAppointmentStart(slotStart)
                                                    setIsNewAppointmentOpen(true)
                                                }}
                                                className={cn(
                                                    "border-r border-b border-slate-100 relative group transition-all p-1 cursor-pointer min-h-[80px] overflow-visible",
                                                    isOver ? "bg-teal-500/10 ring-2 ring-inset ring-teal-500/40 z-10" : "hover:bg-slate-50/30"
                                                )}
                                            >
                                                {filteredBlockedSlots.filter(
                                                    (blk) => blk.staff_id === dentist.id && isSameDay(blk.start, day) && blk.start.getHours() === hour
                                                ).map((blk) => (
                                                    <BlockedSlotCard key={blk.id} blk={blk} />
                                                ))}
                                                {filteredAppointments.filter(
                                                    (appt) =>
                                                        appt.dentist_id === dentist.id && isSameDay(appt.start, day) && appt.start.getHours() === hour
                                                ).map((appt) => (
                                                    <AppointmentCard key={appt.id} appt={appt} />
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </>
                ) : view !== "month" ? (
                    <>
                        <div className="overflow-x-auto overflow-y-hidden">
                        <div className={cn("grid border-b border-slate-100 min-w-[min(100%,600px)] sm:min-w-0", view === "day" ? "grid-cols-[70px_1fr] sm:grid-cols-[100px_1fr]" : "grid-cols-[70px_repeat(7,minmax(0,1fr))] sm:grid-cols-[100px_repeat(7,1fr)]")}>
                            <div className="p-2 sm:p-4 bg-slate-50/50 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center border-r border-slate-100 shrink-0">
                                TIME
                            </div>
                            {days.map(day => (
                                <div key={day.toString()} className={cn("p-2 sm:p-4 border-r border-slate-100 text-center flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-0", isSameDay(day, new Date()) ? "bg-teal-50/30" : "")}>
                                    <div className={cn("text-[9px] sm:text-[10px] font-bold uppercase", isSameDay(day, new Date()) ? "text-teal-600" : "text-slate-400")}>{format(day, "EEE")}</div>
                                    <div className={cn("text-base sm:text-xl font-bold h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full shrink-0", isSameDay(day, new Date()) ? "bg-teal-600 text-white" : "text-slate-700")}>{format(day, "d")}</div>
                                </div>
                            ))}
                        </div>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-thin min-h-0">
                            {hours.map(hour => (
                                <div key={hour} className={cn("grid h-14 sm:h-[80px] shrink-0 min-w-[min(100%,600px)] sm:min-w-0", view === "day" ? "grid-cols-[70px_1fr] sm:grid-cols-[100px_1fr]" : "grid-cols-[70px_repeat(7,minmax(0,1fr))] sm:grid-cols-[100px_repeat(7,1fr)]")}>
                                    <div className="border-r border-b border-slate-100 bg-slate-50/30 text-[9px] sm:text-[10px] text-slate-400 font-bold p-1 sm:p-2 text-center sticky left-0 bg-slate-50/30 z-[1] flex items-start justify-center pt-2 sm:pt-3 h-14 sm:h-[80px] shrink-0">
                                        {format(setHours(new Date(), hour), "h a")}
                                    </div>

                                    {days.map(day => {
                                        const isOver = draggedOver?.day === day.toISOString() && draggedOver?.hour === hour
                                        return (
                                            <div
                                                key={day.toString()}
                                                onDragOver={handleDragOver(day, hour)}
                                                onDragLeave={handleDragLeave(day, hour)}
                                                onDrop={handleDrop(day, hour)}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest("[data-appointment]") || (e.target as HTMLElement).closest("[data-blocked]")) return
                                                    const slotStart = setHours(startOfDay(day), hour)
                                                    setNewAppointmentStart(slotStart)
                                                    setIsNewAppointmentOpen(true)
                                                }}
                                                className={cn(
                                                    "border-r border-b border-slate-100 relative group transition-all p-1 cursor-pointer h-[80px] overflow-visible",
                                                    isOver ? "bg-teal-500/10 ring-2 ring-inset ring-teal-500/40 z-10" : "hover:bg-slate-50/30"
                                                )}
                                            >
                                                {filteredBlockedSlots.filter(blk =>
                                                    isSameDay(blk.start, day) &&
                                                    blk.start.getHours() === hour
                                                ).map(blk => (
                                                    <BlockedSlotCard key={blk.id} blk={blk} />
                                                ))}
                                                {filteredAppointments.filter(appt =>
                                                    isSameDay(appt.start, day) &&
                                                    appt.start.getHours() === hour
                                                ).map(appt => (
                                                    <AppointmentCard key={appt.id} appt={appt} />
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
                {view === "month" ? (
                    /* Month View Grid */
                    <div className="grid grid-cols-7 h-full min-w-0 overflow-auto">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="p-1.5 sm:p-3 bg-slate-50/50 border-b border-r border-slate-100 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase text-center shrink-0">
                                {d}
                            </div>
                        ))}
                        {days.map(day => {
                            const dayApps = filteredAppointments.filter(a => isSameDay(a.start, day))
                            const dayBlocks = filteredBlockedSlots.filter(blk => isSameDay(blk.start, day))
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isOver = draggedOver?.day === day.toISOString() && draggedOver?.hour === undefined

                            return (
                                <div
                                    key={day.toString()}
                                    onDragOver={handleDragOver(day)}
                                    onDrop={handleDrop(day)}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest("[data-appointment]") || (e.target as HTMLElement).closest("[data-blocked]")) return
                                        const slotStart = setHours(startOfDay(day), minHour)
                                        setNewAppointmentStart(slotStart)
                                        setIsNewAppointmentOpen(true)
                                    }}
                                    className={cn(
                                        "min-h-[80px] sm:min-h-[120px] border-r border-b border-slate-100 p-1 sm:p-2 transition-all cursor-pointer min-w-0",
                                        !isCurrentMonth ? "bg-slate-50/30 opacity-40" : "",
                                        isSameDay(day, new Date()) ? "bg-teal-50/20" : "",
                                        isOver ? "bg-teal-500/5 ring-2 ring-inset ring-teal-500/30 z-10" : "hover:bg-slate-50/30"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full",
                                            isSameDay(day, new Date()) ? "bg-teal-600 text-white" : "text-slate-600"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                        {dayApps.length > 0 && (
                                            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">
                                                {dayApps.length} apps
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        {dayBlocks.slice(0, 2).map(blk => (
                                            <BlockedSlotCard key={blk.id} blk={blk} isMonthView={true} />
                                        ))}
                                        {dayApps.slice(0, 3).map(appt => (
                                            <AppointmentCard key={appt.id} appt={appt} isMonthView={true} />
                                        ))}
                                        {(dayApps.length > 3 || dayBlocks.length > 2) && (
                                            <div className="text-[9px] text-slate-400 font-bold px-2">
                                                + {Math.max(dayApps.length - 3, 0) + Math.max(dayBlocks.length - 2, 0)} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </div>

            {contextMenuBlock && typeof document !== "undefined" && createPortal(
                <div
                    data-block-context-menu
                    className="fixed z-[100] min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                    style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => handleUnblock(contextMenuBlock.id)}
                        disabled={isUnblocking}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        {isUnblocking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Unlock className="h-4 w-4 text-teal-600" />
                        )}
                        Unblock
                    </button>
                </div>,
                document.body
            )}

            <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5 text-teal-400" />
                            Reschedule Appointment
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Please confirm the new time for <strong>{pendingReschedule?.appointment?.patientName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        {pendingReschedule?.conflictPatient && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-800">
                                <Activity className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-xs uppercase tracking-wider">Schedule Conflict</p>
                                    <p className="text-[11px] opacity-80">This slot is already booked for {pendingReschedule.conflictPatient}.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 space-y-1 text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original</p>
                                <p className="text-sm font-bold text-slate-700">{pendingReschedule?.appointment?.start && format(pendingReschedule.appointment.start, "EEE, MMM d")}</p>
                                <p className="text-xs text-slate-500">{pendingReschedule?.appointment?.start && format(pendingReschedule.appointment.start, "h:mm a")}</p>
                            </div>
                            <div className="flex items-center justify-center">
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                            </div>
                            <div className="flex-1 space-y-1 text-center p-3 bg-teal-50 rounded-xl border border-teal-100 shadow-sm shadow-teal-500/5">
                                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">New Time</p>
                                <p className="text-sm font-bold text-teal-700 font-mono">{pendingReschedule?.newStart && format(pendingReschedule.newStart, "EEE, MMM d")}</p>
                                <p className="text-xs text-teal-600 font-bold">{pendingReschedule?.newStart && format(pendingReschedule.newStart, "h:mm a")}</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <Button variant="ghost" className="flex-1 h-11 text-slate-500 font-bold hover:bg-slate-100" onClick={() => setIsRescheduleOpen(false)} disabled={isUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={confirmReschedule} disabled={isUpdating} className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 font-bold">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QueueReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                data={receiptData}
                clinic={clinic ?? undefined}
            />
        </div>
    )
}
