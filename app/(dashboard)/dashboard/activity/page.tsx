"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Activity, Loader2, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"

interface ActivityItem {
    name: string
    action: string
    time: string
    timestamp: string
    type: "success" | "warning" | "info"
}

export default function ActivityLogPage() {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const limit = 20

    useEffect(() => {
        fetchActivity()
    }, [offset, typeFilter])

    const fetchActivity = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
            })
            if (typeFilter !== "all") {
                params.set("type", typeFilter)
            }

            const res = await fetch(`/api/dashboard/activity?${params}`)
            if (res.ok) {
                const data = await res.json()
                if (offset === 0) {
                    setActivities(data.activity || [])
                } else {
                    setActivities(prev => [...prev, ...(data.activity || [])])
                }
                setHasMore(data.hasMore || false)
            }
        } catch (error) {
            console.error("Error fetching activity:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadMore = () => {
        setOffset(prev => prev + limit)
    }

    const handleTypeChange = (value: string) => {
        setTypeFilter(value)
        setOffset(0)
        setActivities([])
    }

    return (
        <div className="min-h-screen gradient-mesh p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gradient mb-2">Activity Log</h1>
                            <p className="text-slate-600">Complete history of patient interactions and updates</p>
                        </div>
                        <Select value={typeFilter} onValueChange={handleTypeChange}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Activity</SelectItem>
                                <SelectItem value="appointment">Appointments</SelectItem>
                                <SelectItem value="payment">Payments</SelectItem>
                                <SelectItem value="patient">New Patients</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Activity List */}
                <Card className="card-modern border-0">
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Activity</CardTitle>
                        <CardDescription>
                            {typeFilter === "all" 
                                ? "All clinic activity" 
                                : `Filtered by ${typeFilter}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && activities.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl">
                                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No activity found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activities.map((item, index) => (
                                    <div
                                        key={`${item.timestamp}-${index}`}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-slate-100 transition-all group border border-slate-100"
                                    >
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                                            item.type === "success" ? "bg-emerald-100 text-emerald-600" :
                                            item.type === "warning" ? "bg-amber-100 text-amber-600" :
                                            "bg-blue-100 text-blue-600"
                                        }`}>
                                            <span className="text-sm font-bold">
                                                {item.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-slate-600">{item.action}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {item.time}
                                            </div>
                                            <Badge 
                                                variant="outline" 
                                                className={`text-[10px] ${
                                                    item.type === "success" ? "border-emerald-200 text-emerald-700" :
                                                    item.type === "warning" ? "border-amber-200 text-amber-700" :
                                                    "border-blue-200 text-blue-700"
                                                }`}
                                            >
                                                {item.type}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="pt-4 text-center">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            disabled={isLoading}
                                            className="min-w-[150px]"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                "Load More"
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {!hasMore && activities.length > 0 && (
                                    <p className="text-center text-sm text-slate-500 py-4">
                                        No more activity to show
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
