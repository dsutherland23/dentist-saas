"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Loader2, Users, Clock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, differenceInMinutes, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface WorkloadData {
    name: string
    capacity: number
    booked: number
    utilization: number
    color: string
}

export function WorkloadOverview() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [chartData, setChartData] = useState<WorkloadData[]>([])
    const [weekRange, setWeekRange] = useState({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    })

    useEffect(() => {
        fetchWorkloadData()
    }, [])

    const fetchWorkloadData = async () => {
        setIsLoading(true)
        try {
            // 1. Fetch all staff members
            const { data: staff, error: staffError } = await supabase
                .from('users')
                .select('id, first_name, last_name, role')
                .not('role', 'eq', 'patient')

            if (staffError) throw staffError

            // 2. Fetch all schedules to calculate capacity
            const { data: schedules, error: scheduleError } = await supabase
                .from('staff_schedules')
                .select('*')
                .eq('is_active', true)

            if (scheduleError) throw scheduleError

            // 3. Fetch appointments for this week to calculate booked time
            const { data: appointments, error: apptError } = await supabase
                .from('appointments')
                .select('*')
                .gte('start_time', weekRange.start.toISOString())
                .lte('start_time', weekRange.end.toISOString())
                .not('status', 'eq', 'cancelled')

            if (apptError) throw apptError

            // 4. Transform data for chart
            const workload = staff.map((member, index) => {
                const colors = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981']

                // Calculate weekly capacity (hours)
                const memberSchedules = schedules.filter(s => s.staff_id === member.id)
                let weeklyCapacityMinutes = 0
                memberSchedules.forEach(s => {
                    if (s.start_time && s.end_time) {
                        const [sH, sM] = s.start_time.split(':').map(Number)
                        const [eH, eM] = s.end_time.split(':').map(Number)
                        weeklyCapacityMinutes += (eH * 60 + eM) - (sH * 60 + sM)
                    }
                })

                // Calculate booked minutes from appointments
                const memberAppts = appointments.filter(a => a.dentist_id === member.id)
                const bookedMinutes = memberAppts.reduce((acc, a) => {
                    return acc + differenceInMinutes(new Date(a.end_time), new Date(a.start_time))
                }, 0)

                const capacityHours = Math.round((weeklyCapacityMinutes / 60) * 10) / 10
                const bookedHours = Math.round((bookedMinutes / 60) * 10) / 10

                return {
                    name: `${member.first_name[0]}. ${member.last_name}`,
                    capacity: capacityHours || 0,
                    booked: bookedHours || 0,
                    utilization: capacityHours > 0 ? Math.round((bookedHours / capacityHours) * 100) : 0,
                    color: colors[index % colors.length]
                }
            })

            setChartData(workload.filter(w => w.capacity > 0 || w.booked > 0))
        } catch (error) {
            console.error('Error fetching workload data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    const totalCapacity = chartData.reduce((acc, d) => acc + d.capacity, 0)
    const totalBooked = chartData.reduce((acc, d) => acc + d.booked, 0)
    const avgUtilization = chartData.length > 0
        ? Math.round(chartData.reduce((acc, d) => acc + d.utilization, 0) / chartData.length)
        : 0

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/50 border-slate-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Capacity</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-teal-600" />
                            {totalCapacity}h
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-white/50 border-slate-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Booked</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            {totalBooked}h
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-white/50 border-slate-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">Avg. Utilization</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${avgUtilization > 85 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            {avgUtilization}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="shadow-sm border-none bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Staff Load vs Capacity</CardTitle>
                            <CardDescription>Weekly distribution for {format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'MMM d, yyyy')}</CardDescription>
                        </div>
                        {avgUtilization > 85 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
                                <AlertCircle className="h-3 w-3" />
                                High Utilization
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    unit="h"
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    content={({ payload }) => (
                                        <div className="flex justify-end gap-6 mb-8 text-sm font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-slate-200" />
                                                <span>Capacity (h)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-teal-600" />
                                                <span>Booked (h)</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                <Bar dataKey="capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="booked" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
