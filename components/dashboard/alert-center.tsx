"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Bell,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingDown,
    FileX,
    Loader2,
    X
} from "lucide-react"

interface Alert {
    id: string
    type: 'claims' | 'staff' | 'recalls' | 'collection' | 'general'
    severity: 'high' | 'medium' | 'low' | 'success'
    title: string
    message: string
    count?: number
    action?: string
    actionLink?: string
}

export function AlertCenter() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            // This would aggregate alerts from various sources
            // For now, we'll generate sample alerts
            const sampleAlerts: Alert[] = []

            // Add sample data based on actual dashboard data
            // TODO: Implement real alert aggregation

            setAlerts(sampleAlerts)
        } catch (error) {
            console.error("Error fetching alerts:", error)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <AlertCircle className="h-4 w-4 text-rose-600" />
            case 'medium':
                return <Clock className="h-4 w-4 text-amber-600" />
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            default:
                return <Bell className="h-4 w-4 text-blue-600" />
        }
    }

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-rose-100 text-rose-800 border-rose-200'
            case 'medium':
                return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'success':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }

    const highPriorityCount = alerts.filter(a => a.severity === 'high').length
    const totalAlerts = alerts.length

    return (
        <div className="relative">
            {/* Alert Bell Button */}
            <Button
                variant="outline"
                size="sm"
                className="relative backdrop-blur-sm bg-white/50 border-slate-200/50 hover:bg-white/80"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-4 w-4" />
                {highPriorityCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-rose-500 text-white border-2 border-white text-[10px]">
                        {highPriorityCount}
                    </Badge>
                )}
            </Button>

            {/* Alert Dropdown Panel */}
            {isOpen && (
                <Card className="absolute right-0 top-12 w-96 shadow-2xl border-0 z-50 animate-in slide-in-from-top-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bell className="h-5 w-5 text-teal-600" />
                                Alert Center
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {totalAlerts > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                                {totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="py-8 text-center">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                                <p className="text-sm font-medium text-slate-900 mb-1">
                                    All Clear!
                                </p>
                                <p className="text-xs text-slate-500">
                                    No urgent alerts at this time
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`p-3 rounded-lg border ${
                                                alert.severity === 'high'
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : alert.severity === 'medium'
                                                      ? 'bg-amber-50 border-amber-200'
                                                      : alert.severity === 'success'
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : 'bg-blue-50 border-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5">
                                                    {getSeverityIcon(alert.severity)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {alert.title}
                                                        </p>
                                                        {alert.count && (
                                                            <Badge
                                                                variant="outline"
                                                                className={`${getSeverityBadge(alert.severity)} text-xs shrink-0`}
                                                            >
                                                                {alert.count}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-2">
                                                        {alert.message}
                                                    </p>
                                                    {alert.action && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0 text-xs"
                                                        >
                                                            {alert.action} →
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
