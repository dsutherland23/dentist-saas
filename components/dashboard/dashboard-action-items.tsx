"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, PhoneCall, FileText, Calendar } from "lucide-react"
import Link from "next/link"

interface ActionItemsProps {
    followUpCount: number
    onViewFollowUps?: () => void
}

export function DashboardActionItems({ followUpCount, onViewFollowUps }: ActionItemsProps) {
    const hasActions = followUpCount > 0

    if (!hasActions) {
        return null
    }

    return (
        <Card className="card-modern border-0 border-l-4 border-l-amber-400">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-lg">Action Items</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {followUpCount} {followUpCount === 1 ? 'item' : 'items'}
                    </Badge>
                </div>
                <CardDescription className="text-xs">Tasks that need your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {followUpCount > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PhoneCall className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-900">
                                    Follow-up Needed
                                </span>
                            </div>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                {followUpCount}
                            </Badge>
                        </div>
                        <p className="text-xs text-amber-700 pl-6">
                            Patients with no-show or canceled appointments need rescheduling
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 text-xs border-amber-200 hover:bg-amber-50"
                            onClick={onViewFollowUps}
                        >
                            View Follow-ups
                        </Button>
                    </div>
                )}

                {/* Placeholder for future action items */}
                <div className="text-center py-2">
                    <p className="text-xs text-slate-500">More action items coming soon</p>
                </div>
            </CardContent>
        </Card>
    )
}
