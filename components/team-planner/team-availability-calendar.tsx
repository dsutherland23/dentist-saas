"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isWithinInterval,
    parseISO,
    getDay
} from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, UserX, Calendar as CalendarIcon, Info, Users, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface TimeOffRequest {
    id: string
    staff_id: string
    start_date: string
    end_date: string
    reason: string
    status: string
    staff: {
        id: string
        first_name: string
        last_name: string
        role: string
    }
}

interface StaffSchedule {
    id: string
    staff_id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

interface StaffMember {
    id: string
    first_name: string
    last_name: string
    role: string
    email: string
}

export function TeamAvailabilityCalendar() {
    const supabase = createClient()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [schedules, setSchedules] = useState<StaffSchedule[]>([])
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        fetchCalendarData()
    }, [currentDate])

    const fetchCalendarData = async () => {
        setIsLoading(true)
        try {
            const start = startOfMonth(currentDate)
            const end = endOfMonth(currentDate)

            // 1. Fetch approved time off requests
            const { data: requests, error: requestsError } = await supabase
                .from('time_off_requests')
                .select('*, staff:staff_id(id, first_name, last_name, role)')
                .eq('status', 'approved')
                .or(`start_date.lte.${end.toISOString()},end_date.gte.${start.toISOString()}`)

            if (requestsError) throw requestsError
            setTimeOffRequests(requests || [])

            // 2. Fetch all staff members
            const { data: staffData, error: staffError } = await supabase
                .from('users')
                .select('id, first_name, last_name, role, email')
                .not('role', 'eq', 'patient')

            if (staffError) throw staffError
            setStaff(staffData || [])

            // 3. Fetch all active schedules
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('staff_schedules')
                .select('*')
                .eq('is_active', true)

            if (scheduleError) throw scheduleError
            setSchedules(scheduleData || [])

        } catch (error) {
            console.error('Error fetching calendar data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const getStaffOnOff = (day: Date) => {
        return timeOffRequests.filter(req => {
            const start = parseISO(req.start_date)
            const end = parseISO(req.end_date)
            return isWithinInterval(day, { start, end })
        })
    }

    const handleDayClick = (day: Date) => {
        if (isSameMonth(day, monthStart)) {
            setSelectedDay(day)
            setIsDialogOpen(true)
        }
    }

    const getDailyStatus = (day: Date) => {
        const dayOfWeek = getDay(day) // 0-6 (Sun-Sat)
        const dayOffRequests = getStaffOnOff(day)

        return staff.map(member => {
            const memberSchedule = schedules.find(s => s.staff_id === member.id && s.day_of_week === dayOfWeek)
            const onLeave = dayOffRequests.find(req => req.staff_id === member.id)

            let status: 'working' | 'leave' | 'off' = 'off'
            if (onLeave) status = 'leave'
            else if (memberSchedule) status = 'working'

            return {
                ...member,
                schedule: memberSchedule,
                onLeave,
                status
            }
        })
    }

    if (isLoading && timeOffRequests.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle className="text-xl font-bold font-outfit text-slate-900 leading-none">Team Availability</CardTitle>
                    <CardDescription className="mt-1.5">Track leaves and team presence. Click a day to view full roster.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 border-slate-200">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[140px] text-center font-semibold text-slate-700 font-outfit">
                        {format(currentDate, 'MMMM yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 border-slate-200">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="bg-slate-50 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}

                    {calendarDays.map((day, idx) => {
                        const dailyStatus = getDailyStatus(day)
                        const staffWorking = dailyStatus.filter(m => m.status === 'working')
                        const staffOff = dailyStatus.filter(m => m.status === 'leave')
                        const isToday = isSameDay(day, new Date())
                        const isCurrentMonth = isSameMonth(day, monthStart)

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                className={`min-h-[110px] bg-white p-2.5 transition-all cursor-pointer group ${!isCurrentMonth ? 'text-slate-300 bg-slate-50/30' : 'text-slate-900 hover:bg-teal-50/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-semibold h-8 w-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'group-hover:bg-slate-100'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                    {staffOff.length > 0 && isCurrentMonth && (
                                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] font-bold px-2 py-0 h-5">
                                            {staffOff.length} off
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {isCurrentMonth && staffWorking.length > 0 && (
                                        <div className="space-y-1">
                                            {staffWorking.slice(0, 3).map((m) => (
                                                <div key={m.id} className="text-[10px] bg-teal-50/70 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100 truncate flex items-center gap-1">
                                                    <div className="h-1 w-1 rounded-full bg-teal-500 shrink-0" />
                                                    <span className="truncate font-medium">{m.role === 'dentist' ? 'Dr.' : ''} {m.first_name} {m.last_name[0]}.</span>
                                                </div>
                                            ))}
                                            {staffWorking.length > 3 && (
                                                <div className="text-[9px] text-slate-500 font-medium pl-1">+{staffWorking.length - 3} more</div>
                                            )}
                                        </div>
                                    )}
                                    {isCurrentMonth && staffOff.length > 0 && (
                                        <>
                                            {staffOff.slice(0, 2).map((m) => (
                                                <div key={m.id} className="text-[10px] bg-rose-50/60 text-rose-700 px-2 py-0.5 rounded-md border border-rose-100 truncate flex items-center gap-1">
                                                    <div className="h-1 w-1 rounded-full bg-rose-400 shrink-0" />
                                                    <span className="truncate">{m.first_name} {m.last_name[0]}.</span>
                                                </div>
                                            ))}
                                            {staffOff.length > 2 && (
                                                <div className="text-[9px] text-slate-400 font-medium pl-1">+{staffOff.length - 2} off</div>
                                            )}
                                        </>
                                    )}
                                    {isCurrentMonth && staffWorking.length === 0 && staffOff.length === 0 && (
                                        <div className="mt-3 text-[10px] text-slate-400 font-medium flex items-center gap-1.5 opacity-60">
                                            <span>No one scheduled</span>
                                        </div>
                                    )}
                                    {isCurrentMonth && staffWorking.length === 0 && staffOff.length > 0 && (
                                        <div className="text-[10px] text-slate-500 font-medium pl-1">All off / leave</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="mt-8 flex items-center justify-between text-xs text-slate-500 border-t pt-5 border-slate-100">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-teal-600 shadow-sm" />
                            <span className="font-medium">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-teal-500/80" />
                            <span className="font-medium">Scheduled (rota)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-rose-100 border border-rose-200" />
                            <span className="font-medium">On Leave</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 italic">No one scheduled</span>
                        </div>
                    </div>
                </div>

                {/* Daily Detail Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold font-outfit">
                                Day Overview: {selectedDay && format(selectedDay, 'EEEE, MMM do')}
                            </DialogTitle>
                            <DialogDescription>
                                Detailed roster showing staff schedules and availability for the day.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Member</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {selectedDay && getDailyStatus(selectedDay).map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs">
                                                        {member.first_name[0]}{member.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{member.first_name} {member.last_name}</div>
                                                        <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{member.role.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {member.schedule ? (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        {member.schedule.start_time.slice(0, 5)} - {member.schedule.end_time.slice(0, 5)}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No shift scheduled</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center">
                                                    {member.status === 'working' && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 gap-1.5">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Available
                                                        </Badge>
                                                    )}
                                                    {member.status === 'leave' && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 gap-1.5 cursor-help">
                                                                        <XCircle className="h-3 w-3" />
                                                                        On Leave
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">{member.onLeave?.reason || 'Reason not specified'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {member.status === 'off' && (
                                                        <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 font-medium">
                                                            Off Duty
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200">
                                Close Overview
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
