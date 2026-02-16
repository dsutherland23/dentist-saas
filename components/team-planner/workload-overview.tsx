"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Loader2, Users, Clock, AlertCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetch-client"
import { Badge } from "@/components/ui/badge"

interface WorkloadData {
    name: string
    capacity: number
    booked: number
    utilization: number
    color: string
}

export function WorkloadOverview() {
    const [isLoading, setIsLoading] = useState(true)
    const [chartData, setChartData] = useState<WorkloadData[]>([])
    const [weekStartLabel, setWeekStartLabel] = useState("")
    const [weekEndLabel, setWeekEndLabel] = useState("")

    useEffect(() => {
        fetchWorkloadData()
    }, [])

    const fetchWorkloadData = async () => {
        setIsLoading(true)
        try {
            const res = await fetchWithAuth("/api/team-planner/workload-data")
            if (!res.ok) throw new Error("Failed to load workload data")
            const data = await res.json()
            setChartData(data.chartData || [])
            setWeekStartLabel(data.weekStartLabel || "")
            setWeekEndLabel(data.weekEndLabel || "")
        } catch (error) {
            console.error("Error fetching workload data:", error)
            setChartData([])
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
                            <CardDescription>Weekly distribution for {weekStartLabel && weekEndLabel ? `${weekStartLabel} - ${weekEndLabel}` : "this week"}</CardDescription>
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
