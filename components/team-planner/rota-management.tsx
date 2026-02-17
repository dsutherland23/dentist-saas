"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Copy, Loader2, Plus, Trash2, Clock } from "lucide-react"
import { toast } from "sonner"

interface StaffMember {
    id: string
    first_name: string
    last_name: string
    role: string
}

interface Schedule {
    id?: string
    staff_id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const DAYS_OF_WEEK = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
]

export function RotaManagement() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [selectedStaff, setSelectedStaff] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchStaff()
    }, [])

    useEffect(() => {
        if (selectedStaff) {
            fetchSchedules(selectedStaff)
        }
    }, [selectedStaff])

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
                if (data.length > 0 && !selectedStaff) {
                    setSelectedStaff(data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching staff:', error)
            toast.error('Failed to load staff')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSchedules = async (staffId: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/staff-schedules?staff_id=${staffId}`)
            if (res.ok) {
                const data = await res.json()
                setSchedules(data)
            }
        } catch (error) {
            console.error('Error fetching schedules:', error)
            toast.error('Failed to load schedules')
        } finally {
            setIsLoading(false)
        }
    }

    const addScheduleSlot = (dayOfWeek: number) => {
        const newSchedule: Schedule = {
            staff_id: selectedStaff,
            day_of_week: dayOfWeek,
            start_time: "09:00",
            end_time: "17:00",
            is_active: true
        }
        setSchedules([...schedules, newSchedule])
    }

    const updateSchedule = (index: number, field: keyof Schedule, value: any) => {
        const updated = [...schedules]
        updated[index] = { ...updated[index], [field]: value }
        setSchedules(updated)
    }

    const removeSchedule = async (index: number) => {
        const schedule = schedules[index]

        if (schedule.id) {
            try {
                const res = await fetch(`/api/staff-schedules?id=${schedule.id}`, {
                    method: 'DELETE'
                })
                if (!res.ok) throw new Error('Failed to delete')
                toast.success('Schedule deleted')
            } catch (error) {
                toast.error('Failed to delete schedule')
                return
            }
        }

        setSchedules(schedules.filter((_, i) => i !== index))
    }

    const saveSchedules = async () => {
        setIsSaving(true)
        try {
            for (const schedule of schedules) {
                const url = '/api/staff-schedules'
                const method = schedule.id ? 'PATCH' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(schedule)
                })

                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error.error || `Failed to ${method === 'PATCH' ? 'update' : 'create'} schedule`)
                }
            }
            toast.success('Schedules saved successfully')
            fetchSchedules(selectedStaff)
        } catch (error: any) {
            console.error('Error saving schedules:', error)
            toast.error(error.message || 'Failed to save schedules')
        } finally {
            setIsSaving(false)
        }
    }

    const copyWeek = () => {
        toast.info('Copy week functionality coming soon')
    }

    const selectedStaffMember = staff.find(s => s.id === selectedStaff)

    if (isLoading && staff.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <Card className="shadow-sm min-w-0 overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col gap-4 min-w-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <CardTitle>Weekly Rota</CardTitle>
                            <CardDescription>Set recurring weekly schedules for staff members</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <Button variant="outline" onClick={copyWeek} className="whitespace-nowrap">
                                <Copy className="h-4 w-4 mr-2 shrink-0" />
                                Copy Week
                            </Button>
                            <Button
                                onClick={saveSchedules}
                                disabled={isSaving}
                                className="bg-teal-600 hover:bg-teal-700 whitespace-nowrap"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2 shrink-0" />
                                )}
                                Save
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:gap-4">
                        <Label htmlFor="staff-select" className="text-sm font-medium shrink-0">Select Staff Member:</Label>
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-initial sm:flex-nowrap">
                            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                                <SelectTrigger id="staff-select" className="min-w-0 w-full sm:w-64">
                                    <SelectValue placeholder="Choose staff..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.first_name} {member.last_name} - {member.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedStaffMember && (
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 shrink-0">
                                    {selectedStaffMember.role}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Grid */}
            <div className="grid gap-4 min-w-0">
                {DAYS_OF_WEEK.map(day => {
                    const daySchedules = schedules.filter(s => s.day_of_week === day.value)

                    return (
                        <Card key={day.value} className="shadow-sm min-w-0 overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="text-lg font-semibold text-slate-900">
                                        {day.label}
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addScheduleSlot(day.value)}
                                        className="text-teal-600 border-teal-200 hover:bg-teal-50 w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-1 shrink-0" />
                                        Add Shift
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {daySchedules.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No shifts scheduled</p>
                                ) : (
                                    <div className="space-y-3">
                                        {schedules.map((schedule, index) => {
                                            if (schedule.day_of_week !== day.value) return null

                                            return (
                                                <div
                                                    key={index}
                                                    className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:gap-4"
                                                >
                                                    {/* Time range row — min-width on inputs so "09:00" doesn't truncate */}
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                                                        <Input
                                                            type="time"
                                                            value={schedule.start_time}
                                                            onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                                                            className="min-w-[7.5rem] max-w-[8rem] shrink-0"
                                                            aria-label="Start time"
                                                        />
                                                        <span className="shrink-0 text-slate-500">to</span>
                                                        <Input
                                                            type="time"
                                                            value={schedule.end_time}
                                                            onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                                                            className="min-w-[7.5rem] max-w-[8rem] shrink-0"
                                                            aria-label="End time"
                                                        />
                                                    </div>
                                                    {/* Active + Delete row */}
                                                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                                                        <div className="flex items-center gap-2">
                                                            <Label htmlFor={`active-${index}`} className="text-sm text-slate-600">
                                                                Active
                                                            </Label>
                                                            <Switch
                                                                id={`active-${index}`}
                                                                checked={schedule.is_active}
                                                                onCheckedChange={(checked) => updateSchedule(index, 'is_active', checked)}
                                                            />
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeSchedule(index)}
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            aria-label="Remove shift"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
