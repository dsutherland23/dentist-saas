"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, History, User, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
    id: string
    table_name: string
    action: string
    created_at: string
    actor?: {
        first_name: string
        last_name: string
    }
}

export function StaffActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchActivity = async () => {
        try {
            const res = await fetch('/api/staff-activity')
            if (res.ok) {
                const data = await res.json()
                setActivities(data)
            }
        } catch (error) {
            console.error("Error fetching activity:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchActivity()
    }, [])

    const getActionLabel = (action: string, table: string) => {
        const tableMap: Record<string, string> = {
            'staff_schedules': 'Schedule',
            'time_off_requests': 'Time Off',
            'staff_schedule_overrides': 'Override'
        }
        const name = tableMap[table] || 'Record'

        switch (action) {
            case 'create': return `Created ${name}`
            case 'update': return `Updated ${name}`
            case 'delete': return `Deleted ${name}`
            case 'approve': return `Approved ${name}`
            case 'reject': return `Rejected ${name}`
            default: return `${action}d ${name}`
        }
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2 text-teal-600">
                    <History className="h-5 w-5" />
                    <CardTitle>Recent Team Activity</CardTitle>
                </div>
                <CardDescription>Live monitoring of schedule and role changes</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-100 rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                        <p className="text-sm">No recent activity found.</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-teal-100 before:via-slate-100 before:to-transparent">
                        {activities.map((item) => (
                            <div key={item.id} className="relative pl-10">
                                <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-teal-500 shadow-sm">
                                    <Clock className="h-4 w-4 text-teal-600" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {getActionLabel(item.action, item.table_name)}
                                        </p>
                                        <span className="text-xs text-slate-400">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <User className="h-3 w-3" />
                                        <span>
                                            {item.actor ? `${item.actor.first_name} ${item.actor.last_name}` : 'System'}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                                            {item.action}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
