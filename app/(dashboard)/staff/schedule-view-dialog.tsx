"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Clock, Loader2, Calendar } from "lucide-react"

interface Schedule {
    id: string
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
}

interface ScheduleViewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff: StaffMember | null
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ScheduleViewDialog({ open, onOpenChange, staff }: ScheduleViewDialogProps) {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && staff) {
            fetchSchedules()
        }
    }, [open, staff])

    const fetchSchedules = async () => {
        if (!staff) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/staff-schedules?staff_id=${staff.id}`)
            if (res.ok) {
                const data = await res.json()
                setSchedules(data)
            }
        } catch (error) {
            console.error("Error fetching schedules:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-teal-600" />
                        {staff?.first_name}'s Weekly Schedule
                    </DialogTitle>
                    <DialogDescription>
                        Current recurring shifts for this team member.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                            <p>No shifts scheduled for this member.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {DAYS_OF_WEEK.map((day, index) => {
                                const daySchedules = schedules.filter(s => s.day_of_week === index && s.is_active)
                                return (
                                    <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 italic">
                                        <span className="font-medium text-slate-700 w-24">{day}</span>
                                        <div className="flex-1 text-right">
                                            {daySchedules.length === 0 ? (
                                                <span className="text-xs text-slate-400">Not scheduled</span>
                                            ) : (
                                                <div className="flex flex-wrap justify-end gap-1.5">
                                                    {daySchedules.map((s) => (
                                                        <Badge key={s.id} variant="outline" className="bg-white text-teal-700 border-teal-100 font-mono text-[11px]">
                                                            {s.start_time} - {s.end_time}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
