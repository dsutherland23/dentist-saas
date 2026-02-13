"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, UserCheck, BarChart3 } from "lucide-react"
import { RotaManagement } from "@/components/team-planner/rota-management"
import { TimeOffRequests } from "@/components/team-planner/time-off-requests"
import { TeamAvailabilityCalendar } from "@/components/team-planner/team-availability-calendar"
import { WorkloadOverview } from "@/components/team-planner/workload-overview"

export default function TeamPlannerPage() {
    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Planner</h1>
                <p className="text-slate-500 mt-1">Manage staff schedules, time-off requests, and workload distribution</p>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="rota" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                    <TabsTrigger
                        value="rota"
                        className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                    >
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Rota Management</span>
                        <span className="sm:hidden">Rota</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="time-off"
                        className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                    >
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Time-Off Requests</span>
                        <span className="sm:hidden">Time-Off</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Team Calendar</span>
                        <span className="sm:hidden">Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="workload"
                        className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Workload Overview</span>
                        <span className="sm:hidden">Workload</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content */}
                <TabsContent value="rota" className="mt-6">
                    <RotaManagement />
                </TabsContent>

                <TabsContent value="time-off" className="mt-6">
                    <TimeOffRequests />
                </TabsContent>

                <TabsContent value="calendar" className="mt-6">
                    <TeamAvailabilityCalendar />
                </TabsContent>

                <TabsContent value="workload" className="mt-6">
                    <WorkloadOverview />
                </TabsContent>
            </Tabs>
        </div>
    )
}
