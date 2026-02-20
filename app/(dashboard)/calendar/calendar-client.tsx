"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
    startOfDay,
    isBefore
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Loader2, Activity, Ban, Unlock, Phone, Users, Calendar, CheckCircle, XCircle, Download, X, Stethoscope, User, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NewAppointmentDialog } from "./new-appointment-dialog"
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
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { differenceInMinutes, addMinutes, isAfter } from "date-fns"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { CheckoutPaymentModal } from "@/components/calendar/checkout-payment-modal"
import { useRouter } from "next/navigation"
import { QueueReceiptDialog, type QueueReceiptData } from "@/components/calendar/queue-receipt-dialog"
import { AllAppointmentsDialog } from "@/components/calendar/all-appointments-dialog"
import { VisitProgressPanel, type VisitForPanel, type PatientVerificationData } from "@/components/calendar/visit-progress-panel"

interface Appointment {
    id: string
    title?: string
    start_time: string
    end_time: string
    treatment_type: string
    status: string
    patient_id: string
    dentist_id: string
    room?: string | null
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
    clinic?: { name: string; logo_url?: string | null; phone?: string | null; website?: string | null; require_consent_in_visit_flow?: boolean } | null
    currentUserId?: string | null
    currentUserRole?: string | null
    initialAppointmentId?: string | null
    /** When true, open the "View All" appointments dialog on mount (e.g. from dashboard "View all" link) */
    initialOpenAll?: boolean
}

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        setIsMobile(mq.matches)
        const fn = () => setIsMobile(mq.matches)
        mq.addEventListener("change", fn)
        return () => mq.removeEventListener("change", fn)
    }, [])
    return isMobile
}

export default function CalendarClient({ initialAppointments, initialBlockedSlots = [], patients, dentists, clinic, currentUserId = null, currentUserRole = null, initialAppointmentId = null, initialOpenAll = false }: CalendarClientProps) {
    const router = useRouter()
    const isMobile = useIsMobile()
    const [allAppointmentsDialogOpen, setAllAppointmentsDialogOpen] = useState(!!initialOpenAll)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<"day" | "week" | "month">("week")
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
    const [checkoutAppt, setCheckoutAppt] = useState<{ id: string; patientName: string; treatment_type: string; patient_id: string } | null>(null)
    const [selectedApptForDetail, setSelectedApptForDetail] = useState<any | null>(null)
    const [openAppointmentIdForVisit, setOpenAppointmentIdForVisit] = useState<string | null>(null)
    const [visitData, setVisitData] = useState<VisitForPanel | null>(null)
    const [visitLoading, setVisitLoading] = useState(false)
    const [patientVerificationData, setPatientVerificationData] = useState<PatientVerificationData | null>(null)
    const [patientSummaryHoverOpen, setPatientSummaryHoverOpen] = useState(false)
    const patientSummaryCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Fetch patient profile summary when detail panel opens (for auto-verify + hover summary)
    useEffect(() => {
        const pid = selectedApptForDetail?.patient_id
        if (!pid) {
            setPatientVerificationData(null)
            return
        }
        let cancelled = false
        fetch(`/api/patients/${pid}/visit-verification`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (!cancelled) setPatientVerificationData(data) })
            .catch(() => { if (!cancelled) setPatientVerificationData(null) })
        return () => { cancelled = true }
    }, [selectedApptForDetail?.patient_id])

    // Default to Day view on mobile so the grid isn't cramped
    useEffect(() => {
        if (isMobile) setView((prev) => (prev === "week" ? "day" : prev))
    }, [isMobile])

    // Open "View All" from dashboard link and clear URL so refresh doesn't reopen
    useEffect(() => {
        if (initialOpenAll) {
            router.replace("/calendar", { scroll: false })
        }
    }, [initialOpenAll, router])
    const [visitTransitioning, setVisitTransitioning] = useState(false)
    const openForVisitRef = useRef<string | null>(null)
    useEffect(() => { openForVisitRef.current = openAppointmentIdForVisit }, [openAppointmentIdForVisit])

    const fetchVisitForAppointment = useCallback(async (appointmentId: string) => {
        setVisitLoading(true)
        setVisitData(null)
        try {
            const res = await fetch(`/api/visits?appointmentId=${encodeURIComponent(appointmentId)}`)
            const json = await res.json().catch(() => ({}))
            if (openForVisitRef.current === appointmentId) {
                if (res.ok && json.visit) setVisitData(json.visit)
            }
        } catch {
            if (openForVisitRef.current === appointmentId) setVisitData(null)
        } finally {
            if (openForVisitRef.current === appointmentId) setVisitLoading(false)
        }
    }, [])

    const handleVisitTransition = useCallback(async (appointmentId: string, nextState: string, flags?: Record<string, boolean>) => {
        setVisitTransitioning(true)
        try {
            const res = await fetch("/api/visits/transition", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, nextState, flags }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((json as { error?: string }).error || "Transition failed")
            if (json.visit) setVisitData(json.visit)
            if (json.appointment) router.refresh()
            toast.success("Visit updated")
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update visit")
        } finally {
            setVisitTransitioning(false)
        }
    }, [router])

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

    // Navigate to appointment and open detail + visit flow when opening calendar from dashboard with ?appointmentId=...
    useEffect(() => {
        if (!initialAppointmentId || initialAppointments.length === 0) return
        const raw = initialAppointments.find(a => a.id === initialAppointmentId)
        if (!raw) return
        const start = parseISO(raw.start_time)
        setCurrentDate(startOfDay(start))
        setView("day")
        const normalized = {
            ...raw,
            start,
            end: parseISO(raw.end_time),
            patientName: raw.patients ? `${raw.patients.first_name} ${raw.patients.last_name}` : "Unknown Patient",
            dentistName: raw.dentists ? `Dr. ${raw.dentists.last_name}` : "Unknown Dentist",
            patientPhone: raw.patients?.phone ?? null
        }
        setSelectedApptForDetail(normalized)
        setOpenAppointmentIdForVisit(initialAppointmentId)
        fetchVisitForAppointment(initialAppointmentId)
        router.replace("/calendar", { scroll: false })
        const t = setTimeout(() => {
            const el = document.querySelector(`[data-appointment-id="${initialAppointmentId}"]`)
            el?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 300)
        return () => clearTimeout(t)
    }, [initialAppointmentId, initialAppointments, fetchVisitForAppointment, router])

    const filteredDentists = staffFilterId
        ? dentists.filter(d => d.id === staffFilterId)
        : dentists
    // Show all clinic appointments; staff dropdown filters by dentist when selected
    const filteredAppointments = staffFilterId
        ? appointments.filter(a => a.dentist_id === staffFilterId)
        : appointments
    const filteredBlockedSlots = staffFilterId
        ? blockedSlots.filter(b => b.staff_id === staffFilterId)
        : blockedSlots

    // Dynamic date calculations based on view
    let startDate: Date, endDate: Date
    if (view === "day") {
        startDate = startOfDay(currentDate)
        endDate = startOfDay(currentDate)
    } else if (view === "week") {
        startDate = startOfDay(currentDate)
        endDate = addDays(startDate, 6)
    } else {
        startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    }

    const apptHours = filteredAppointments.map(a => a.start.getHours())
    const minHour = Math.min(7, ...apptHours.length ? apptHours : [8])
    const maxHour = Math.max(19, ...apptHours.length ? apptHours : [17])

    const days = view === "day" ? [currentDate] : eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour)

    const todayRef = startOfDay(new Date())
    const isPastDay = (day: Date) => isBefore(startOfDay(day), todayRef)
    const isPastSlot = (day: Date, hour?: number) => {
        if (isPastDay(day)) return true
        if (hour === undefined) return false
        const now = new Date()
        return isSameDay(day, now) && hour < now.getHours()
    }

    // Calculate statistics for current view period
    const viewAppointments = filteredAppointments.filter(appt => {
        const apptDate = appt.start
        if (view === "day") {
            return isSameDay(apptDate, currentDate)
        } else if (view === "week") {
            return apptDate >= startDate && apptDate <= endDate
        } else {
            return isSameMonth(apptDate, currentDate)
        }
    })

    const stats = {
        total: viewAppointments.length,
        confirmed: viewAppointments.filter(a => a.status === 'confirmed').length,
        pending: viewAppointments.filter(a => ['pending', 'scheduled', 'unconfirmed'].includes(a.status)).length,
        cancelled: viewAppointments.filter(a => ['cancelled', 'no_show'].includes(a.status)).length,
    }

    // Chair utilization calculation
    const totalAppointmentHours = viewAppointments.reduce((sum, appt) => {
        return sum + differenceInMinutes(appt.end, appt.start) / 60
    }, 0)
    const uniqueRooms = new Set(viewAppointments.filter(a => a.room).map(a => a.room)).size || 1
    const daysInPeriod = view === "day" ? 1 : view === "week" ? 7 : days.length
    const availableHours = uniqueRooms * daysInPeriod * 8
    const chairUtilization = availableHours > 0 ? Math.round((totalAppointmentHours / availableHours) * 100) : 0

    const nextPeriod = () => {
        if (view === "day") setCurrentDate(current => addDays(current, 1))
        else if (view === "week") setCurrentDate(current => addDays(current, 7))
        else setCurrentDate(current => addMonths(current, 1))
    }

    const prevPeriod = () => {
        if (view === "day") setCurrentDate(current => addDays(current, -1))
        else if (view === "week") setCurrentDate(current => addDays(current, -7))
        else setCurrentDate(current => addMonths(current, -1))
    }

    const today = () => {
        const now = new Date()
        setCurrentDate(now)
        setView("day") // Switching to day view on "Today" click provides better immediate focus
    }

    // Helper to format the period label
    const getPeriodLabel = () => {
        if (view === "day") return format(currentDate, "MMMM d, yyyy")
        if (view === "week") {
            const start = startDate
            const end = endDate
            if (isSameMonth(start, end)) {
                return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`
            }
            return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        }
        return format(currentDate, "MMMM yyyy")
    }

    const BlockedSlotCard = ({ blk, isMonthView = false }: { blk: any; isMonthView?: boolean }) => {
        const blockClass = "text-[10px] px-2 py-1 rounded bg-slate-200/70 text-slate-500 font-medium border border-slate-300/60 cursor-context-menu opacity-90"
        const timeRange = `${format(blk.start, "h:mm a")} – ${format(blk.end, "h:mm a")}`
        const tooltipContent = (
            <div className="space-y-1 text-left max-w-[220px]">
                <div className="font-semibold text-slate-900">{blk.dentistName}</div>
                <div className="text-slate-600">{timeRange}</div>
                {blk.reason ? (
                    <div className="text-slate-600 border-t border-slate-200 pt-1.5 mt-1.5">
                        <span className="text-slate-500 text-xs uppercase tracking-wide">Reason</span>
                        <p className="text-sm mt-0.5">{blk.reason}</p>
                    </div>
                ) : (
                    <div className="text-slate-500 text-xs">No reason given</div>
                )}
            </div>
        )

        const onContextMenu = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setContextMenuBlock({ id: blk.id, dentistName: blk.dentistName })
            setContextMenuPos({ x: e.clientX, y: e.clientY })
        }

        const cardContent = isMonthView ? (
            <div data-blocked onContextMenu={onContextMenu} className={cn(blockClass, "w-full truncate flex items-center gap-1")}>
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
            >
                <div className="truncate flex items-center gap-1">
                    <Ban className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="font-bold text-slate-500 uppercase text-[8px] shrink-0">{format(blk.start, "h a")}</span>
                    <span className="truncate">{blk.dentistName} blocked</span>
                </div>
            </div>
        )

        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
                    <TooltipContent side="right" className="z-[100]">
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    const STATUS_DROPDOWN_OPTIONS = [
        { value: "pending", label: "Pending" },
        { value: "unconfirmed", label: "Unconfirmed" },
        { value: "confirmed", label: "Confirm" },
        { value: "checked_in", label: "Checked in" },
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

        const openCard = (e: React.MouseEvent) => {
            e.stopPropagation()
            setSelectedApptForDetail(appt)
            setOpenAppointmentIdForVisit(appt.id)
            fetchVisitForAppointment(appt.id)
        }

        const timeRange = `${format(appt.start, "h:mm a")} – ${format(appt.end, "h:mm a")}`
        const statusLabel = (appt.status || "scheduled").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        const appointmentTooltipContent = (
            <div key={appt.id} className="w-[260px] text-left">
                <p className="text-[15px] font-semibold text-slate-900 tracking-tight truncate" title={appt.patientName}>
                    {appt.patientName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {timeRange}
                </p>
                {appt.treatment_type && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Treatment</p>
                        <p className="text-sm text-slate-700 mt-0.5 leading-snug">{appt.treatment_type}</p>
                    </div>
                )}
                <p className="text-sm text-slate-600 mt-1.5 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {appt.dentistName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-700 capitalize">
                        {statusLabel}
                    </span>
                </div>
                {appt.patientPhone && (
                    <p className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                        {appt.patientPhone}
                    </p>
                )}
            </div>
        )

        const monthViewCard = (
            <div
                data-appointment
                data-appointment-id={appt.id}
                draggable
                role="button"
                tabIndex={0}
                onClick={openCard}
                onKeyDown={(e) => e.key === "Enter" && openCard(e as any)}
                onDragStart={(e) => {
                    e.dataTransfer.setData("appointmentId", appt.id)
                    e.dataTransfer.effectAllowed = "move"
                }}
                className={cn(cardBaseClass, "w-full truncate cursor-pointer")}
            >
                <span className="font-bold text-teal-600 uppercase text-[8px] mr-1 shrink-0">{format(appt.start, "h a")}</span>
                <span className="truncate">{appt.patientName}</span>
            </div>
        )

        const weekDayViewCard = (
            <div
                data-appointment
                data-appointment-id={appt.id}
                draggable
                role="button"
                tabIndex={0}
                onClick={openCard}
                onKeyDown={(e) => e.key === "Enter" && openCard(e as any)}
                onDragStart={(e) => {
                    e.dataTransfer.setData("appointmentId", appt.id)
                    e.dataTransfer.effectAllowed = "move"
                }}
                className={cn(cardBaseClass, "absolute left-1 right-1 p-2 z-20 group/appt overflow-hidden cursor-pointer")}
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
        )

        const cardContent = isMonthView ? monthViewCard : weekDayViewCard
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
                    <TooltipContent
                        side="right"
                        sideOffset={8}
                        className="z-[100] w-auto max-w-[280px] rounded-lg border-slate-200/90 bg-white px-4 py-3 shadow-lg"
                    >
                        {appointmentTooltipContent}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    const handleDrop = (day: Date, hour?: number) => (e: React.DragEvent) => {
        e.preventDefault()
        const isPast = hour !== undefined ? isPastSlot(day, hour) : isPastDay(day)
        if (isPast) {
            setDraggedOver(null)
            return
        }
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
        const isPast = hour !== undefined ? isPastSlot(day, hour) : isPastDay(day)
        if (isPast) {
            if (draggedOver) setDraggedOver(null)
            return
        }
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

    const exportSchedule = () => {
        const header = "Date,Time,Patient,Treatment,Status,Room,Dentist\n"
        const rows = viewAppointments.map(appt => {
            const date = format(appt.start, "yyyy-MM-dd")
            const time = `${format(appt.start, "HH:mm")}-${format(appt.end, "HH:mm")}`
            const patient = appt.patientName.replace(/,/g, "")
            const treatment = appt.treatment_type?.replace(/,/g, "") || "N/A"
            const status = appt.status
            const room = appt.room || "N/A"
            const dentist = appt.dentistName.replace(/,/g, "")
            return `${date},${time},"${patient}","${treatment}",${status},${room},"${dentist}"`
        }).join("\n")
        
        const csv = header + rows
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `schedule-${view}-${format(currentDate, "yyyy-MM-dd")}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Schedule exported")
    }

    return (
        <div className="flex flex-col min-h-[400px] h-[calc(100vh-8rem)] sm:h-[calc(100vh-100px)] bg-slate-50 p-3 sm:p-4 md:p-6 max-w-full w-full min-w-0 overflow-hidden">
            <CheckoutPaymentModal
                open={!!checkoutAppt}
                onOpenChange={(o) => !o && setCheckoutAppt(null)}
                appointment={checkoutAppt ?? { id: "", patientName: "", treatment_type: "", patient_id: "" }}
                onConfirmPaid={async () => {
                    if (checkoutAppt) {
                        setCheckoutAppt(null)
                        await handleStatusChange(checkoutAppt.id, "completed")
                        router.refresh()
                    }
                }}
            />
            
            {/* Global 'View All' dialog so it works from toolbar and mobile menu */}
            {currentUserId && (
                <AllAppointmentsDialog
                    currentUserId={currentUserId}
                    dentists={dentists}
                    clinic={clinic}
                    open={allAppointmentsDialogOpen}
                    onOpenChange={setAllAppointmentsDialogOpen}
                />
            )}

            {/* Header with Period Label and Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                    <h2 className={cn(
                        "font-bold text-slate-800 truncate",
                        isMobile ? "text-base" : "text-lg sm:text-xl md:text-2xl"
                    )}>
                        {isMobile
                                ? view === "day"
                                    ? format(currentDate, "MMM d")
                                    : view === "week"
                                        ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d") + " – " + format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")
                                        : format(currentDate, "MMM yyyy")
                                : getPeriodLabel()}
                    </h2>
                </div>

                {isMobile ? (
                    /* Mobile: compact toolbar + More menu */
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-md border bg-white shadow-sm overflow-hidden border-slate-200 shrink-0">
                                <Button variant="ghost" size="icon" onClick={prevPeriod} className="rounded-none border-r border-slate-100 h-9 w-9 hover:bg-slate-50 hover:text-teal-600"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" onClick={today} className="px-3 font-bold rounded-none border-r border-slate-100 h-9 text-xs uppercase tracking-wider hover:bg-slate-50 hover:text-teal-600">Today</Button>
                                <Button variant="ghost" size="icon" onClick={nextPeriod} className="rounded-none h-9 w-9 hover:bg-slate-50 hover:text-teal-600"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                                {(["day", "week", "month"] as const).map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={cn(
                                            "px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                                            view === v ? "bg-white shadow-sm text-teal-600" : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 border-slate-200">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">More</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {currentUserId && (
                                        <DropdownMenuItem onClick={() => setAllAppointmentsDialogOpen(true)}>
                                            <Calendar className="h-3.5 w-3.5 mr-2" />
                                            View All
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={exportSchedule}>
                                        <Download className="h-3.5 w-3.5 mr-2" />
                                        Export
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStaffFilterId(null)}>
                                        <Users className="h-3.5 w-3.5 mr-2" />
                                        All staff
                                    </DropdownMenuItem>
                                    {dentists.map((d) => (
                                        <DropdownMenuItem key={d.id} onClick={() => setStaffFilterId(d.id)}>
                                            Dr. {d.last_name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <NewAppointmentDialog
                                patients={patients}
                                dentists={dentists}
                                trigger={
                                    <Button size="sm" className="h-9 bg-teal-600 hover:bg-teal-700 text-xs shrink-0 ml-auto">
                                        <Plus className="h-4 w-4 mr-1" /> New
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
                ) : (
                    /* Desktop: full toolbar */
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {currentUserId && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 text-xs border-slate-200 hover:border-teal-300 hover:bg-teal-50"
                                onClick={() => setAllAppointmentsDialogOpen(true)}
                            >
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                View All
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={exportSchedule} className="h-8 sm:h-9 text-xs border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Export
                        </Button>
                        <div className="flex items-center rounded-md border bg-white shadow-sm overflow-hidden border-slate-200">
                            <Button variant="ghost" size="icon" onClick={prevPeriod} className="rounded-none border-r border-slate-100 h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={today} className="px-2 sm:px-4 font-bold rounded-none border-r border-slate-100 h-8 sm:h-9 text-xs uppercase tracking-wider hover:bg-slate-50 hover:text-teal-600 transition-colors">Today</Button>
                            <Button variant="ghost" size="icon" onClick={nextPeriod} className="rounded-none h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {(["day", "week", "month"] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={cn(
                                        "px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all capitalize",
                                        view === v ? "bg-white shadow-sm text-teal-600" : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
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
                        <NewAppointmentDialog
                            patients={patients}
                            dentists={dentists}
                            trigger={
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm shrink-0" onClick={() => { setNewAppointmentStart(undefined); setIsNewAppointmentOpen(true) }}>
                                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Appointment
                                </Button>
                            }
                            open={isNewAppointmentOpen}
                            onOpenChange={(o) => { setIsNewAppointmentOpen(o); if (!o) setNewAppointmentStart(undefined) }}
                            initialStartDate={newAppointmentStart}
                        />
                    </div>
                )}
            </div>

            {/* Statistics Panel */}
            <div className={cn(
                "flex items-center gap-2 mb-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0",
                isMobile ? "overflow-x-auto overflow-y-hidden flex-nowrap pb-1" : "flex-wrap"
            )}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-100 shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{stats.total} Total</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">{stats.confirmed} Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">{stats.pending} Pending</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 shrink-0">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span className="text-xs font-semibold text-rose-700 whitespace-nowrap">{stats.cancelled} Cancelled</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 shrink-0">
                    <Activity className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">{chairUtilization}% Chair Use</span>
                </div>
            </div>

            {/* Outer row: calendar + inline detail panel share one card */}
            <div className="flex-1 min-h-0 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* ── Calendar column ── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col min-w-0">
                {view !== "month" ? (
                    <>
                        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                            <div className={cn(
                                "grid border-b border-slate-100 shrink-0",
                                view === "day"
                                    ? "grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] min-w-[320px]"
                                    : "grid-cols-[60px_repeat(7,minmax(64px,1fr))] sm:grid-cols-[80px_repeat(7,minmax(0,1fr))] min-w-[548px] sm:min-w-0"
                            )}>
                                <div className="sticky left-0 z-[2] p-2 sm:p-4 bg-slate-50/50 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center border-r border-slate-100 shrink-0">
                                    TIME
                                </div>
                                {days.map(day => (
                                    <div key={day.toString()} className={cn("p-2 sm:p-4 border-r border-slate-100 text-center flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-0", isSameDay(day, new Date()) ? "bg-teal-50/30" : "", isPastDay(day) ? "opacity-60 bg-slate-100 text-slate-400" : "")}>
                                        <div className={cn("text-[9px] sm:text-[10px] font-bold uppercase truncate w-full", isSameDay(day, new Date()) ? "text-teal-600" : isPastDay(day) ? "text-slate-400" : "text-slate-400")}>{format(day, "EEE")}</div>
                                        <div className={cn("text-sm sm:text-xl font-bold h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full shrink-0", isSameDay(day, new Date()) ? "bg-teal-600 text-white" : isPastDay(day) ? "text-slate-500" : "text-slate-700")}>{format(day, "d")}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 min-h-0">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className={cn(
                                            "grid h-12 sm:h-[80px] shrink-0",
                                            view === "day"
                                                ? "grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] min-w-[320px]"
                                                : "grid-cols-[60px_repeat(7,minmax(64px,1fr))] sm:grid-cols-[80px_repeat(7,minmax(0,1fr))] min-w-[548px] sm:min-w-0"
                                        )}
                                    >
                                        <div className="sticky left-0 z-[1] border-r border-b border-slate-100 bg-slate-50/30 text-[9px] sm:text-[10px] text-slate-400 font-bold p-1 sm:p-2 text-center flex items-center justify-center h-12 sm:h-[80px] shrink-0">
                                            {format(setHours(new Date(), hour), "h a")}
                                        </div>

                                        {days.map(day => {
                                            const isOver = draggedOver?.day === day.toISOString() && draggedOver?.hour === hour
                                            const past = isPastSlot(day, hour)
                                            return (
                                                <div
                                                    key={day.toString()}
                                                    title={past ? "Past date – cannot book" : undefined}
                                                    onDragOver={handleDragOver(day, hour)}
                                                    onDragLeave={handleDragLeave(day, hour)}
                                                    onDrop={handleDrop(day, hour)}
                                                    onClick={(e) => {
                                                        if (past) return
                                                        if ((e.target as HTMLElement).closest("[data-appointment]") || (e.target as HTMLElement).closest("[data-blocked]")) return
                                                        const slotStart = setHours(startOfDay(day), hour)
                                                        setNewAppointmentStart(slotStart)
                                                        setIsNewAppointmentOpen(true)
                                                    }}
                                                    className={cn(
                                                        "border-r border-b border-slate-100 relative group transition-all p-0.5 sm:p-1 min-h-[48px] sm:min-h-[80px] overflow-hidden",
                                                        past ? "bg-slate-50/80 opacity-70 cursor-not-allowed" : "cursor-pointer",
                                                        !past && (isOver ? "bg-teal-500/10 ring-2 ring-inset ring-teal-500/40 z-10" : "hover:bg-slate-50/30")
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
                            const past = isPastDay(day)

                            return (
                                <div
                                    key={day.toString()}
                                    title={past ? "Past date – cannot book" : undefined}
                                    onDragOver={handleDragOver(day)}
                                    onDrop={handleDrop(day)}
                                    onClick={(e) => {
                                        if (past) return
                                        if ((e.target as HTMLElement).closest("[data-appointment]") || (e.target as HTMLElement).closest("[data-blocked]")) return
                                        const slotStart = setHours(startOfDay(day), minHour)
                                        setNewAppointmentStart(slotStart)
                                        setIsNewAppointmentOpen(true)
                                    }}
                                    className={cn(
                                        "min-h-[80px] sm:min-h-[120px] border-r border-b border-slate-100 p-1 sm:p-2 transition-all min-w-0",
                                        past ? "bg-slate-50/80 opacity-70 cursor-not-allowed" : "cursor-pointer",
                                        !past && !isCurrentMonth ? "bg-slate-50/30 opacity-40" : "",
                                        !past && isSameDay(day, new Date()) ? "bg-teal-50/20" : "",
                                        !past && (isOver ? "bg-teal-500/5 ring-2 ring-inset ring-teal-500/30 z-10" : "hover:bg-slate-50/30")
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full",
                                            isSameDay(day, new Date()) ? "bg-teal-600 text-white" : past ? "text-slate-400" : "text-slate-600"
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
            </div>{/* end calendar column */}

            {/* ── Inline detail panel column ── */}
            {(() => {
                const appt = selectedApptForDetail
                const isOpen = !!appt

                const closeDetail = () => {
                    setSelectedApptForDetail(null)
                    setOpenAppointmentIdForVisit(null)
                    setVisitData(null)
                }

                const colorIndex = appt ? dentists.findIndex((d: { id: string }) => d.id === appt.dentist_id) % 5 : 0
                const accentColors = [
                    { light: "bg-teal-50",   text: "text-teal-700",   ring: "ring-teal-200" },
                    { light: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200" },
                    { light: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
                    { light: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200" },
                    { light: "bg-rose-50",   text: "text-rose-700",   ring: "ring-rose-200" },
                ]
                const accent = accentColors[colorIndex] || accentColors[0]
                const initials = appt
                    ? appt.patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                    : ""

                const now = new Date()
                const showStatusDropdown = appt
                    ? isAfter(now, addMinutes(appt.start, 1)) && !["completed"].includes(appt.status)
                    : false

                const statusBadgeClass = (s: string) => {
                    if (s === "checked_in" || s === "in_treatment") return "bg-emerald-100 border-emerald-200 text-emerald-800"
                    if (s === "completed") return "bg-slate-100 border-slate-200 text-slate-600"
                    if (s === "cancelled" || s === "no_show") return "bg-rose-100 border-rose-200 text-rose-700"
                    return "bg-amber-100 border-amber-200 text-amber-700"
                }

                const detailSections = appt ? (
                    <>
                        {/* Header */}
                        <div className={cn("shrink-0 px-3 py-3 border-b border-slate-100", accent.light)}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Avatar className={cn("h-8 w-8 shrink-0 border-2 border-white shadow ring-1", accent.ring)}>
                                                <AvatarFallback className={cn("font-bold text-xs", accent.text)}>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <Popover open={patientSummaryHoverOpen} onOpenChange={setPatientSummaryHoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <div
                                                            className="cursor-default"
                                                            onMouseEnter={() => {
                                                                if (patientSummaryCloseTimerRef.current) {
                                                                    clearTimeout(patientSummaryCloseTimerRef.current)
                                                                    patientSummaryCloseTimerRef.current = null
                                                                }
                                                                setPatientSummaryHoverOpen(true)
                                                            }}
                                                            onMouseLeave={() => {
                                                                patientSummaryCloseTimerRef.current = setTimeout(() => setPatientSummaryHoverOpen(false), 200)
                                                            }}
                                                        >
                                                            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{appt.patientName}</p>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-72 p-3"
                                                        align="start"
                                                        side="right"
                                                        onMouseEnter={() => {
                                                            if (patientSummaryCloseTimerRef.current) {
                                                                clearTimeout(patientSummaryCloseTimerRef.current)
                                                                patientSummaryCloseTimerRef.current = null
                                                            }
                                                            setPatientSummaryHoverOpen(true)
                                                        }}
                                                        onMouseLeave={() => {
                                                            patientSummaryCloseTimerRef.current = setTimeout(() => setPatientSummaryHoverOpen(false), 150)
                                                        }}
                                                    >
                                                        <p className="text-xs font-semibold text-slate-800 mb-2">Patient info</p>
                                                        {patientVerificationData ? (
                                                            <div className="space-y-2 text-[11px] text-slate-600">
                                                                <div>
                                                                    <span className="font-medium text-slate-500">Contact</span>
                                                                    <p className="mt-0.5">{patientVerificationData.phone || "—"}</p>
                                                                    <p className="mt-0.5">{patientVerificationData.email || "—"}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-slate-500">Insurance</span>
                                                                    <p className="mt-0.5">{patientVerificationData.insurance_provider || "—"}</p>
                                                                    {patientVerificationData.insurance_policy_number && (
                                                                        <p className="mt-0.5">Policy: {patientVerificationData.insurance_policy_number}</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-slate-500">Allergies</span>
                                                                    <p className="mt-0.5">{patientVerificationData.allergies?.trim() || "None on file"}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-slate-500">Medical conditions</span>
                                                                    <p className="mt-0.5">{patientVerificationData.medical_conditions?.trim() || "None on file"}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[11px] text-slate-500">Loading…</p>
                                                        )}
                                                    </PopoverContent>
                                                </Popover>
                                                {appt.patientPhone && (
                                                    <a href={`tel:${appt.patientPhone}`} className="text-[10px] text-slate-400 hover:text-teal-600 flex items-center gap-1 mt-0.5">
                                                        <Phone className="h-2.5 w-2.5 shrink-0" />{appt.patientPhone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeDetail}
                                            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
                                            aria-label="Close"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable body */}
                                <div className="flex-1 overflow-y-auto overscroll-contain">

                                    {/* Key details */}
                                    <div className="px-3 py-2.5 border-b border-slate-100 space-y-2">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" /> Time
                                            </p>
                                            <p className="text-xs font-semibold text-slate-800">{format(appt.start, "h:mm a")} – {format(appt.end, "h:mm a")}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{format(appt.start, "EEE, MMM d")}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                    <Stethoscope className="h-2.5 w-2.5" /> Treatment
                                                </p>
                                                <p className="text-[11px] font-semibold text-slate-700 leading-snug">{appt.treatment_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5" /> Dentist
                                                </p>
                                                <p className="text-[11px] font-semibold text-slate-700 leading-snug">{appt.dentistName}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                            {showStatusDropdown ? (
                                                <Select
                                                    value={statusToDropdownValue(appt.status)}
                                                    onValueChange={(v) => handleStatusChange(appt.id, v)}
                                                    disabled={updatingStatusId === appt.id}
                                                >
                                                    <SelectTrigger className="h-6 w-full text-[10px] font-semibold px-2 border-slate-200">
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUS_DROPDOWN_OPTIONS.map((o) => (
                                                            <SelectItem key={o.value} value={o.value} className="text-xs">
                                                                {o.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="outline" className={cn("text-[9px] font-semibold px-1.5 py-0.5", statusBadgeClass(appt.status))}>
                                                    {getAppointmentStatusLabel(appt.status)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Check-in / out */}
                                    {(appt.checked_in_at || appt.checked_out_at) && (
                                        <div className="px-3 py-2 border-b border-slate-100 space-y-1">
                                            {appt.checked_in_at && (
                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    <span className="text-slate-400">In</span>
                                                    <span className="font-semibold text-slate-600">{format(parseISO(appt.checked_in_at), "h:mm a")}</span>
                                                </div>
                                            )}
                                            {appt.checked_out_at && (
                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                    <span className="text-slate-400">Out</span>
                                                    <span className="font-semibold text-slate-600">{format(parseISO(appt.checked_out_at), "h:mm a")}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Visit progress */}
                                    {openAppointmentIdForVisit === appt.id && (
                                        <div className="px-3 py-2.5">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visit progress</p>
                                            {visitLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-slate-300" aria-hidden />
                                                </div>
                                            ) : visitData ? (
                                                <VisitProgressPanel
                                                    visit={visitData}
                                                    onTransition={(nextState, flags) => handleVisitTransition(appt.id, nextState, flags)}
                                                    userRole={currentUserRole}
                                                    disabled={visitTransitioning}
                                                    patientId={appt.patient_id}
                                                    patientVerificationData={patientVerificationData}
                                                    requireConsentInVisitFlow={clinic?.require_consent_in_visit_flow ?? false}
                                                />
                                            ) : appt.status !== "completed" && appt.status !== "cancelled" ? (
                                                <Button
                                                    className="w-full h-7 text-[11px] bg-teal-600 hover:bg-teal-700"
                                                    disabled={visitTransitioning}
                                                    onClick={() => handleVisitTransition(appt.id, "ARRIVED")}
                                                >
                                                    {visitTransitioning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                    Check in
                                                </Button>
                                            ) : null}
                                        </div>
                                    )}
                                </div>

                                {/* Sticky footer actions */}
                                <div className="shrink-0 px-3 py-2.5 border-t border-slate-100 bg-slate-50/60 space-y-1.5">
                                    {!visitData && appt.status !== "completed" && appt.status !== "cancelled" && appt.status !== "checked_in" && appt.status !== "in_treatment" && (
                                        <Button
                                            className="w-full h-7 text-[11px] font-semibold bg-teal-600 hover:bg-teal-700"
                                            disabled={updatingStatusId === appt.id}
                                            onClick={() => handleStatusChange(appt.id, "checked_in")}
                                        >
                                            {updatingStatusId === appt.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                            Check In
                                        </Button>
                                    )}
                                    {!visitData && appt.status === "checked_in" && (
                                        <Button
                                            className="w-full h-7 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700"
                                            disabled={updatingStatusId === appt.id}
                                            onClick={() => handleStatusChange(appt.id, "in_treatment")}
                                        >
                                            {updatingStatusId === appt.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                                            Start Treatment
                                        </Button>
                                    )}
                                    {!visitData && (appt.status === "checked_in" || appt.status === "in_treatment") && (
                                        <Button
                                            className="w-full h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700"
                                            disabled={updatingStatusId === appt.id}
                                            onClick={() => setCheckoutAppt({ id: appt.id, patientName: appt.patientName, treatment_type: appt.treatment_type || "Appointment", patient_id: appt.patient_id })}
                                        >
                                            {updatingStatusId === appt.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                            Check Out
                                        </Button>
                                    )}
                                    <div className="flex gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-7 text-[10px] border-slate-200 text-slate-500"
                                            onClick={() => {
                                                closeDetail()
                                                setIsRescheduleOpen(true)
                                                setPendingReschedule({ appointment: appt, newStart: appt.start, newEnd: appt.end, conflictPatient: null })
                                            }}
                                        >
                                            Reschedule
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                                            onClick={closeDetail}
                                            aria-label="Close"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                        </>
                ) : null

                return (
                    <>
                        {!isMobile && (
                            <div
                                className={cn(
                                    "shrink-0 flex flex-col border-l border-slate-100 bg-white overflow-hidden",
                                    "transition-[width] duration-300 ease-in-out",
                                    isOpen ? "w-64" : "w-0"
                                )}
                            >
                                {detailSections && <div className="w-64 flex flex-col h-full overflow-hidden">{detailSections}</div>}
                            </div>
                        )}
                        {isMobile && (
                            <Sheet open={isOpen} onOpenChange={(open) => !open && closeDetail()}>
                                <SheetContent side="bottom" className="max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                                    {detailSections && <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">{detailSections}</div>}
                                </SheetContent>
                            </Sheet>
                        )}
                    </>
                )
            })()}

            </div>{/* end outer row */}

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
