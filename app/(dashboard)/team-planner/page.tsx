"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, UserCheck, BarChart3 } from "lucide-react"
import { RotaManagement } from "@/components/team-planner/rota-management"
import { TimeOffRequests } from "@/components/team-planner/time-off-requests"
import { TeamAvailabilityCalendar } from "@/components/team-planner/team-availability-calendar"
import { WorkloadOverview } from "@/components/team-planner/workload-overview"

const TEAM_PLANNER_TABS = [
    { value: "rota", label: "Rota Management", icon: Clock },
    { value: "time-off", label: "Time-Off Requests", icon: UserCheck },
    { value: "calendar", label: "Team Calendar", icon: Calendar },
    { value: "workload", label: "Workload Overview", icon: BarChart3 },
] as const

export default function TeamPlannerPage() {
    const [activeTab, setActiveTab] = useState("rota")
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Team Planner</h1>
                <p className="text-slate-500 mt-1">Manage staff schedules, time-off requests, and workload distribution</p>
            </div>

            {/* Tabs — dropdown on small screens, tab list from md up */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                <div className="mb-4 md:mb-0">
                    <div className="md:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="w-full bg-white border-slate-200">
                                <SelectValue placeholder="Choose section" />
                            </SelectTrigger>
                            <SelectContent>
                                {TEAM_PLANNER_TABS.map((tab) => (
                                    <SelectItem key={tab.value} value={tab.value}>
                                        <span className="flex items-center gap-2">
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <TabsList
                        className="hidden md:grid w-full grid-cols-4 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                    >
                        {TEAM_PLANNER_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                            >
                                <tab.icon className="h-4 w-4 shrink-0" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Tab Content — min-w-0 to prevent horizontal overflow on small screens */}
                <TabsContent value="rota" className="mt-6 min-w-0">
                    <RotaManagement />
                </TabsContent>

                <TabsContent value="time-off" className="mt-6 min-w-0">
                    <TimeOffRequests />
                </TabsContent>

                <TabsContent value="calendar" className="mt-6 min-w-0">
                    <TeamAvailabilityCalendar />
                </TabsContent>

                <TabsContent value="workload" className="mt-6 min-w-0">
                    <WorkloadOverview />
                </TabsContent>
            </Tabs>
        </div>
    )
}
