"use client"

import { useState } from "react"
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
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Loader2, Activity } from "lucide-react"
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
import { differenceInMinutes, addMinutes } from "date-fns"

interface Appointment {
    id: string
    title?: string
    start_time: string
    end_time: string
    treatment_type: string
    status: string
    patient_id: string
    dentist_id: string
    patients?: { first_name: string, last_name: string }
    dentists?: { first_name: string, last_name: string }
}

interface CalendarClientProps {
    initialAppointments: Appointment[]
    patients: { id: string; first_name: string; last_name: string }[]
    dentists: { id: string; first_name: string; last_name: string }[]
}

export default function CalendarClient({ initialAppointments, patients, dentists }: CalendarClientProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<"day" | "week" | "month">("week")
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
    const [pendingReschedule, setPendingReschedule] = useState<{
        appointment: any,
        newStart: Date,
        newEnd: Date,
        conflictPatient?: string | null
    } | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [draggedOver, setDraggedOver] = useState<{ day: string; hour?: number } | null>(null)

    const appointments = initialAppointments.map(appt => ({
        ...appt,
        start: parseISO(appt.start_time),
        end: parseISO(appt.end_time),
        patientName: appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : "Unknown Patient",
        dentistName: appt.dentists ? `Dr. ${appt.dentists.last_name}` : "Unknown Dentist"
    }))

    // Dynamic date calculations based on view
    let startDate: Date, endDate: Date
    if (view === "day") {
        startDate = startOfDay(currentDate)
        endDate = startOfDay(currentDate)
    } else if (view === "week") {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
    } else {
        startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    }

    const apptHours = appointments.map(a => a.start.getHours())
    const minHour = Math.min(7, ...apptHours.length ? apptHours : [8])
    const maxHour = Math.max(19, ...apptHours.length ? apptHours : [17])

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour)

    const nextPeriod = () => {
        if (view === "day") setCurrentDate(current => addDays(current, 1))
        else if (view === "week") setCurrentDate(current => addWeeks(current, 1))
        else setCurrentDate(current => addMonths(current, 1))
    }

    const prevPeriod = () => {
        if (view === "day") setCurrentDate(current => addDays(current, -1))
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
        if (view === "day") return format(currentDate, "MMMM d, yyyy")
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

    const AppointmentCard = ({ appt, isMonthView = false }: { appt: any, isMonthView?: boolean }) => {
        const colorIndex = dentists.findIndex(d => d.id === appt.dentist_id) % 5
        const colors = [
            "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100",
            "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
            "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
            "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
            "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
        ]
        const colorClass = colors[colorIndex] || colors[0]

        return (
            <Popover>
                <PopoverTrigger asChild>
                    {isMonthView ? (
                        <div
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("appointmentId", appt.id)
                                e.dataTransfer.effectAllowed = "move"
                            }}
                            className="text-[10px] px-2 py-1 rounded bg-slate-100/50 text-slate-700 truncate font-medium border border-slate-200/50 cursor-grab active:cursor-grabbing hover:bg-slate-200/50 transition-colors"
                        >
                            <span className="font-bold text-teal-600 uppercase text-[8px] mr-1">{format(appt.start, "h a")}</span>
                            {appt.patientName}
                        </div>
                    ) : (
                        <div
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("appointmentId", appt.id)
                                e.dataTransfer.effectAllowed = "move"
                            }}
                            className={cn(
                                "absolute inset-x-1 p-2 rounded-lg border text-[11px] shadow-sm cursor-grab active:cursor-grabbing transition-all z-20 group/appt overflow-hidden hover:ring-2 hover:ring-teal-500 hover:ring-offset-1 scrollbit-hidden",
                                colorClass
                            )}
                            style={{
                                top: `${(appt.start.getMinutes() / 60) * 100}%`,
                                height: `${Math.max((appt.end.getTime() - appt.start.getTime()) / 60000 / 60 * 100, 35)}%`,
                                minHeight: "40px"
                            }}
                        >
                            <div className="font-bold truncate flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-current opacity-50" />
                                {appt.patientName}
                            </div>
                            <div className="opacity-80 truncate pl-2 font-medium">{appt.treatment_type}</div>
                        </div>
                    )}
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 overflow-hidden border-slate-200 shadow-xl" side="right" align="start">
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
                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-slate-50 border-slate-200 text-slate-500 font-bold">
                                Confirmed
                            </Badge>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] font-bold">Reschedule</Button>
                        <Button className="flex-1 h-8 text-[11px] font-bold bg-teal-600 hover:bg-teal-700">Check In</Button>
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
        <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-slate-800 min-w-[280px]">
                        {getPeriodLabel()}
                    </h2>
                    <div className="flex items-center rounded-md border bg-white shadow-sm overflow-hidden border-slate-200">
                        <Button variant="ghost" size="icon" onClick={prevPeriod} className="rounded-none border-r border-slate-100 h-9 w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" onClick={today} className="px-4 font-bold rounded-none border-r border-slate-100 h-9 text-xs uppercase tracking-wider hover:bg-slate-50 hover:text-teal-600 transition-colors">Today</Button>
                        <Button variant="ghost" size="icon" onClick={nextPeriod} className="rounded-none h-9 w-9 hover:bg-slate-50 hover:text-teal-600 transition-colors"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(["day", "week", "month"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-semibold rounded-md transition-all capitalize",
                                    view === v ? "bg-white shadow-sm text-teal-600" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <NewAppointmentDialog patients={patients} dentists={dentists} />
                </div>
            </div>

            <div className="flex-1 border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col border-slate-200">
                {view !== "month" ? (
                    <>
                        <div className={cn("grid border-b border-slate-100", view === "day" ? "grid-cols-[100px_1fr]" : "grid-cols-[100px_repeat(7,1fr)]")}>
                            <div className="p-4 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center border-r border-slate-100">
                                TIME (EST)
                            </div>
                            {days.map(day => (
                                <div key={day.toString()} className={cn("p-4 border-r border-slate-100 text-center flex flex-col items-center justify-center gap-1", isSameDay(day, new Date()) ? "bg-teal-50/30" : "")}>
                                    <div className={cn("text-[10px] font-bold uppercase", isSameDay(day, new Date()) ? "text-teal-600" : "text-slate-400")}>{format(day, "EEE")}</div>
                                    <div className={cn("text-xl font-bold h-8 w-8 flex items-center justify-center rounded-full", isSameDay(day, new Date()) ? "bg-teal-600 text-white" : "text-slate-700")}>{format(day, "d")}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto relative scrollbar-thin">
                            {hours.map(hour => (
                                <div key={hour} className={cn("grid min-h-[80px]", view === "day" ? "grid-cols-[100px_1fr]" : "grid-cols-[100px_repeat(7,1fr)]")}>
                                    <div className="border-r border-b border-slate-100 bg-slate-50/30 text-[10px] text-slate-400 font-bold p-2 text-center sticky left-0 flex items-start justify-center pt-3">
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
                                                className={cn(
                                                    "border-r border-b border-slate-100 relative group transition-all p-1",
                                                    isOver ? "bg-teal-500/10 ring-2 ring-inset ring-teal-500/40 z-10" : "hover:bg-slate-50/30"
                                                )}
                                            >
                                                {appointments.filter(appt =>
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
                ) : (
                    /* Month View Grid */
                    <div className="grid grid-cols-7 h-full">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="p-3 bg-slate-50/50 border-b border-r border-slate-100 text-[10px] font-bold text-slate-400 uppercase text-center">
                                {d}
                            </div>
                        ))}
                        {days.map(day => {
                            const dayApps = appointments.filter(a => isSameDay(a.start, day))
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isOver = draggedOver?.day === day.toISOString() && draggedOver?.hour === undefined

                            return (
                                <div
                                    key={day.toString()}
                                    onDragOver={handleDragOver(day)}
                                    // onDragLeave intentionally omitted for month view to keep it stable
                                    onDrop={handleDrop(day)}
                                    className={cn(
                                        "min-h-[120px] border-r border-b border-slate-100 p-2 transition-all",
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
                                    <div className="space-y-1">
                                        {dayApps.slice(0, 3).map(appt => (
                                            <AppointmentCard key={appt.id} appt={appt} isMonthView={true} />
                                        ))}
                                        {dayApps.length > 3 && (
                                            <div className="text-[9px] text-slate-400 font-bold px-2">
                                                + {dayApps.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

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
        </div>
    )
}
