"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar, Clock, User, Loader2, ChevronRight, MapPin, Phone, ExternalLink, Save, Filter, X, ClipboardPlus } from "lucide-react"
import { format, parseISO, isFuture, isPast, isToday, startOfDay, isAfter, addMinutes } from "date-fns"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { fetchWithAuth } from "@/lib/fetch-client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TreatmentDialog } from "./treatment-dialog"
import { QueueReceiptDialog, type QueueReceiptData } from "./queue-receipt-dialog"
import type { ClinicBranding } from "@/lib/branding"

interface Appointment {
    id: string
    start_time: string
    end_time: string
    treatment_type: string
    status: string
    room?: string | null
    notes?: string | null
    patient_id: string
    patients?: { first_name: string; last_name: string; phone?: string | null }
    dentists?: { first_name: string; last_name: string }
}

interface AllAppointmentsDialogProps {
    trigger?: React.ReactNode
    currentUserId?: string | null
    dentists?: Array<{ id: string; first_name?: string; last_name: string }>
    /** Clinic branding for queue receipt (logo, name, phone). When provided, queue receipt can show and print. */
    clinic?: ClinicBranding | null
    /** When provided with onOpenChange, dialog open state is controlled (e.g. from URL ?openAll=true) */
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const STATUS_DROPDOWN_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "unconfirmed", label: "Unconfirmed" },
    { value: "confirmed", label: "Confirm" },
    { value: "checked_in", label: "Checked in" },
    { value: "no_show", label: "No-Show" },
    { value: "cancelled", label: "Canceled" },
] as const

const STATUS_FILTER_OPTIONS = [
    { value: "scheduled", label: "Scheduled", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "unconfirmed", label: "Unconfirmed", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "confirmed", label: "Confirmed", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "checked_in", label: "Checked in", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "in_treatment", label: "In Treatment", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "completed", label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: "cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-800 border-rose-200" },
    { value: "no_show", label: "No-Show", color: "bg-rose-100 text-rose-800 border-rose-200" },
] as const

export function AllAppointmentsDialog({ trigger, currentUserId, dentists = [], clinic = null, open: controlledOpen, onOpenChange }: AllAppointmentsDialogProps) {
    const router = useRouter()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined && onOpenChange !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange : setInternalOpen
    const [loading, setLoading] = useState(false)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
    const [savingNotesId, setSavingNotesId] = useState<string | null>(null)
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [availableTreatments, setAvailableTreatments] = useState<Array<{ id: string; name: string; price: number }>>([])
    const [showPast, setShowPast] = useState(false)
    const [receiptData, setReceiptData] = useState<QueueReceiptData | null>(null)
    const [isReceiptOpen, setIsReceiptOpen] = useState(false)
    const [pendingRedirectAppointmentId, setPendingRedirectAppointmentId] = useState<string | null>(null)

    useEffect(() => {
        if (open && currentUserId) {
            fetchAppointments()
            fetchTreatments()
        }
    }, [open, currentUserId])

    const fetchTreatments = async () => {
        try {
            const res = await fetchWithAuth("/api/treatments")
            if (res.ok) {
                const data = await res.json()
                setAvailableTreatments(data || [])
            }
        } catch (error) {
            console.error("Error fetching treatments:", error)
        }
    }

    const fetchAppointments = async () => {
        if (!currentUserId) return
        
        setLoading(true)
        try {
            const res = await fetchWithAuth(`/api/appointments/my-appointments?dentistId=${currentUserId}`)
            if (res.ok) {
                const data = await res.json()
                setAppointments(data.appointments || [])
                // Initialize editing notes with existing notes
                const notesMap: Record<string, string> = {}
                data.appointments?.forEach((appt: Appointment) => {
                    notesMap[appt.id] = appt.notes || ""
                })
                setEditingNotes(notesMap)
            } else {
                console.error("Failed to fetch appointments")
            }
        } catch (error) {
            console.error("Error fetching appointments:", error)
        } finally {
            setLoading(false)
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
            toast.success("Status updated")

            // When changing to Checked in: show queue receipt (if API returned queueNumber), then redirect to calendar
            if (newStatus === "checked_in") {
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
                    setPendingRedirectAppointmentId(appointmentId)
                    setIsReceiptOpen(true)
                } else {
                    setPendingRedirectAppointmentId(appointmentId)
                }
                const transitionRes = await fetch("/api/visits/transition", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ appointmentId, nextState: "ARRIVED" }),
                })
                if (!transitionRes.ok) {
                    const errData = await transitionRes.json().catch(() => ({}))
                    console.warn("[AllAppointments] visit transition failed:", errData)
                }
                // If we didn't show receipt, redirect now; otherwise redirect when receipt is closed
                if (typeof d?.queueNumber !== "number") {
                    setOpen(false)
                    router.push(`/calendar?appointmentId=${appointmentId}`)
                }
                return
            }

            await fetchAppointments()
        } catch (error) {
            toast.error("Failed to update status")
        } finally {
            setUpdatingStatusId(null)
        }
    }

    const handleReceiptOpenChange = (open: boolean) => {
        setIsReceiptOpen(open)
        if (!open && pendingRedirectAppointmentId) {
            setOpen(false)
            router.push(`/calendar?appointmentId=${pendingRedirectAppointmentId}`)
            setPendingRedirectAppointmentId(null)
        }
    }

    const handleNotesUpdate = async (appointmentId: string) => {
        const notes = editingNotes[appointmentId] || ""
        setSavingNotesId(appointmentId)
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            })
            if (!res.ok) throw new Error("Update failed")
            toast.success("Notes saved")
            await fetchAppointments()
        } catch (error) {
            toast.error("Failed to save notes")
        } finally {
            setSavingNotesId(null)
        }
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-slate-100 text-slate-700 border-slate-200"
            case "checked_in":
            case "in_treatment":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "scheduled":
            case "confirmed":
            case "pending":
            case "unconfirmed":
                return "bg-amber-100 text-amber-800 border-amber-200"
            case "cancelled":
            case "no_show":
                return "bg-rose-100 text-rose-800 border-rose-200"
            default:
                return "bg-slate-100 text-slate-600 border-slate-200"
        }
    }

    const statusToDropdownValue = (s: string) => {
        if (["pending", "unconfirmed", "confirmed", "checked_in", "no_show", "cancelled"].includes(s)) return s
        if (s === "scheduled") return "pending"
        if (s === "in_treatment") return "checked_in"
        return "pending"
    }

    // Filter appointments by selected statuses
    const filteredAppointments = selectedStatuses.length > 0
        ? appointments.filter(a => selectedStatuses.includes(a.status))
        : appointments

    // Group appointments by relative time and status
    const now = startOfDay(new Date())
    const upcomingAppointments = filteredAppointments
        .filter(a => {
            const start = parseISO(a.start_time)
            const isUpcomingByTime = isFuture(start) || isToday(start)
            const isFinalStatus = ["completed", "cancelled", "no_show"].includes(a.status)
            // Only show non-final statuses in Upcoming
            return isUpcomingByTime && !isFinalStatus
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    
    const pastAppointments = filteredAppointments
        .filter(a => {
            const start = parseISO(a.start_time)
            const isPastByTime = isPast(start) && !isToday(start)
            const isFinalStatus = ["completed", "cancelled", "no_show"].includes(a.status)
            // Treat completed / cancelled / no_show as history, even if marked early
            return isPastByTime || isFinalStatus
        })
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        )
    }

    const clearFilters = () => {
        setSelectedStatuses([])
    }

    const handleViewInCalendar = (appointmentId: string) => {
        setOpen(false)
        router.push(`/calendar?appointmentId=${appointmentId}`)
    }

    const AppointmentAccordionItem = ({ appt, section }: { appt: Appointment; section: "upcoming" | "past" }) => {
        const appointmentStart = parseISO(appt.start_time)
        const appointmentEnd = parseISO(appt.end_time)
        const now = new Date()
        const oneMinAfterStart = addMinutes(appointmentStart, 1)
        const showStatusDropdown = isAfter(now, oneMinAfterStart) && !["completed"].includes(appt.status)
        const notesChanged = editingNotes[appt.id] !== (appt.notes || "")

        return (
            <AccordionItem value={appt.id} className="border rounded-xl mb-2">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 rounded-xl">
                    <div className="flex items-start justify-between gap-3 w-full pr-2">
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                    "text-sm font-bold",
                                    section === "upcoming" ? "text-slate-900" : "text-slate-700"
                                )}>
                                    {format(appointmentStart, "EEEE, MMM d, yyyy")}
                                </span>
                                {isToday(appointmentStart) && (
                                    <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] px-1.5 py-0">
                                        Today
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(appointmentStart, "h:mm a")} - {format(appointmentEnd, "h:mm a")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">
                                    {appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown Patient"}
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn("text-[10px] font-medium shrink-0", getStatusBadgeClass(appt.status))}
                        >
                            {getAppointmentStatusLabel(appt.status)}
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                        {/* Appointment Details */}
                        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Treatment</p>
                                <p className="text-sm font-semibold text-slate-700">{appt.treatment_type || "General Appointment"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Dentist</p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {appt.dentists ? `Dr. ${appt.dentists.last_name}` : "Unknown Dentist"}
                                </p>
                            </div>
                            {appt.room && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Room</p>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-teal-600" />
                                        <p className="text-sm font-semibold text-slate-700">{appt.room}</p>
                                    </div>
                                </div>
                            )}
                            {appt.patients?.phone && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                                    <a
                                        href={`tel:${appt.patients.phone}`}
                                        className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                        {appt.patients.phone}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Status Management */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {showStatusDropdown ? (
                                    <Select
                                        value={statusToDropdownValue(appt.status)}
                                        onValueChange={(v) => handleStatusChange(appt.id, v)}
                                        disabled={updatingStatusId === appt.id}
                                    >
                                        <SelectTrigger className="h-9 w-[140px] text-xs">
                                            {updatingStatusId === appt.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <SelectValue placeholder="Status" />
                                            )}
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
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs font-medium", getStatusBadgeClass(appt.status))}
                                    >
                                        {getAppointmentStatusLabel(appt.status)}
                                    </Badge>
                                )}
                                {/* Action Buttons */}
                                {appt.status !== "completed" && appt.status !== "cancelled" && appt.status !== "no_show" && (
                                    <>
                                        {(appt.status === "pending" || appt.status === "confirmed" || appt.status === "unconfirmed" || appt.status === "scheduled") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
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
                                                className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                disabled={updatingStatusId === appt.id}
                                                onClick={() => handleStatusChange(appt.id, "in_treatment")}
                                            >
                                                {updatingStatusId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Start Treatment"}
                                            </Button>
                                        )}
                                        {(appt.status === "checked_in" || appt.status === "in_treatment") && (
                                            <Button
                                                size="sm"
                                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                disabled={updatingStatusId === appt.id}
                                                onClick={() => handleStatusChange(appt.id, "completed")}
                                            >
                                                {updatingStatusId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Complete"}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Treatment Plan Button (shown when in_treatment) */}
                        {appt.status === "in_treatment" && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Treatment</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 w-full"
                                    onClick={() => {
                                        setSelectedPatientId(appt.patient_id)
                                        setTreatmentDialogOpen(true)
                                    }}
                                >
                                    <ClipboardPlus className="h-4 w-4 mr-2" />
                                    Create Treatment Plan
                                </Button>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes</p>
                                {notesChanged && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleNotesUpdate(appt.id)}
                                        disabled={savingNotesId === appt.id}
                                    >
                                        {savingNotesId === appt.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <Save className="h-3 w-3 mr-1" />
                                        )}
                                        Save Notes
                                    </Button>
                                )}
                            </div>
                            <Textarea
                                value={editingNotes[appt.id] || ""}
                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [appt.id]: e.target.value }))}
                                placeholder="Add appointment notes..."
                                className="min-h-[80px] text-sm"
                            />
                        </div>

                        {/* View in Calendar */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleViewInCalendar(appt.id)}
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            View in Calendar
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        )
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        All My Appointments
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden w-[95vw] sm:w-full">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-xl font-bold">All My Appointments</DialogTitle>
                    <DialogDescription>
                        Manage your appointments, update status, and add notes
                    </DialogDescription>
                </DialogHeader>

                {/* Status Filters */}
                {!loading && appointments.length > 0 && (
                    <div className="space-y-3 pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700">Filter by Status</span>
                                {selectedStatuses.length > 0 && (
                                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                                        {selectedStatuses.length} active
                                    </Badge>
                                )}
                            </div>
                            {selectedStatuses.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTER_OPTIONS.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => toggleStatusFilter(status.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                        selectedStatuses.includes(status.value)
                                            ? cn(status.color, "ring-2 ring-offset-1 ring-teal-400 shadow-sm")
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    )}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-medium">No appointments found</p>
                        <p className="text-xs mt-1">You don't have any scheduled appointments</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                        <Filter className="h-12 w-12 mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-medium">No appointments match your filters</p>
                        <p className="text-xs mt-1">Try adjusting your status filters</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-4"
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 max-h-[60vh]">
                        <div className="space-y-6 pb-4">
                            {/* Upcoming Appointments */}
                            {upcomingAppointments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Upcoming ({upcomingAppointments.length})
                                    </h3>
                                    <Accordion type="single" collapsible className="space-y-0">
                                        {upcomingAppointments.map((appt) => (
                                            <AppointmentAccordionItem key={appt.id} appt={appt} section="upcoming" />
                                        ))}
                                    </Accordion>
                                </div>
                            )}

                            {/* Past Appointments (collapsed by default) */}
                            {pastAppointments.length > 0 && (
                                <div>
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between mb-2 text-slate-600 hover:text-slate-800"
                                        onClick={() => setShowPast((prev) => !prev)}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                            <Calendar className="h-4 w-4" />
                                            Past ({pastAppointments.length})
                                        </span>
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 transition-transform duration-150",
                                                showPast ? "rotate-90" : ""
                                            )}
                                        />
                                    </button>
                                    {showPast && (
                                        <Accordion type="single" collapsible className="space-y-0">
                                            {pastAppointments.map((appt) => (
                                                <AppointmentAccordionItem key={appt.id} appt={appt} section="past" />
                                            ))}
                                        </Accordion>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex shrink-0 items-center justify-between border-t pt-4">
                    <p className="text-xs text-slate-500">
                        {selectedStatuses.length > 0 ? (
                            <>
                                Showing {filteredAppointments.length} of {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
                            </>
                        ) : (
                            <>
                                Total: {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
                            </>
                        )}
                    </p>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </div>

                {/* Treatment Dialog */}
                {selectedPatientId && (
                    <TreatmentDialog
                        open={treatmentDialogOpen}
                        onOpenChange={(open) => {
                            setTreatmentDialogOpen(open)
                            if (!open) {
                                setSelectedPatientId(null)
                                fetchAppointments() // Refresh appointments after creating treatment
                            }
                        }}
                        patientId={selectedPatientId}
                        dentists={dentists}
                        availableTreatments={availableTreatments}
                        currentUserId={currentUserId || undefined}
                    />
                )}
            </DialogContent>
        </Dialog>

            {/* Queue receipt when marking Checked in */}
            <QueueReceiptDialog
                open={isReceiptOpen}
                onOpenChange={handleReceiptOpenChange}
                data={receiptData}
                clinic={clinic ?? undefined}
            />
        </>
    )
}
