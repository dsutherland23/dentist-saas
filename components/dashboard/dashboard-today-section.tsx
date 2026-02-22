"use client"

import { DashboardOverviewAppointments } from "@/components/dashboard/dashboard-overview-appointments"
import { DashboardTreatmentPlanPipeline } from "@/components/dashboard/dashboard-treatment-plan-pipeline"
import { DashboardUpcomingReminders } from "@/components/dashboard/dashboard-upcoming-reminders"

export interface DashboardTodaySectionProps {
    refreshKey?: number
}

/**
 * Single "Today" section combining:
 * - Upcoming appointments (schedule)
 * - Treatment plan pipeline
 * - Upcoming reminders to send
 */
export function DashboardTodaySection({ refreshKey = 0 }: DashboardTodaySectionProps) {
    return (
        <section className="space-y-6" aria-labelledby="today-heading">
            <h2 id="today-heading" className="text-sm font-semibold text-slate-600">
                Today
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DashboardOverviewAppointments refreshKey={refreshKey} />
                </div>
                <div>
                    <DashboardTreatmentPlanPipeline refreshKey={refreshKey} />
                </div>
            </div>
            <DashboardUpcomingReminders refreshKey={refreshKey} />
        </section>
    )
}
