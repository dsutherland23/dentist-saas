"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, DollarSign, Shield } from "lucide-react"

interface AIInsightsCardsProps {
    missedAppointments?: number
    totalAppointments?: number
    paymentHistory?: "excellent" | "good" | "poor"
    preventiveCareStatus?: "due" | "current" | "overdue"
}

export function AIInsightsCards({
    missedAppointments = 2,
    totalAppointments = 10,
    paymentHistory = "excellent",
    preventiveCareStatus = "due"
}: AIInsightsCardsProps) {
    // Simple calculations (not actual AI)
    const missedRiskPercentage = Math.min(Math.round((missedAppointments / Math.max(totalAppointments, 1)) * 100), 100)
    const paymentRiskPercentage = paymentHistory === "excellent" ? 95 : paymentHistory === "good" ? 75 : 45
    const preventiveCareConfidence = preventiveCareStatus === "current" ? 95 : preventiveCareStatus === "due" ? 88 : 60

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Missed Visits Risk */}
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Missed Visits Risk</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600">
                        {missedAppointments} missed appointment{missedAppointments !== 1 ? 's' : ''} in 6 months
                    </p>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        AI Confidence: {missedRiskPercentage}%
                    </Badge>
                </CardContent>
            </Card>

            {/* Payment Risk */}
            <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Payment Risk</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 capitalize">
                        {paymentHistory} payment history
                    </p>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        AI Confidence: {paymentRiskPercentage}%
                    </Badge>
                </CardContent>
            </Card>

            {/* Preventive Care */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Preventive Care</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600 capitalize">
                        {preventiveCareStatus === "due" ? "Due for routine cleaning" : 
                         preventiveCareStatus === "current" ? "Up to date" : 
                         "Overdue for checkup"}
                    </p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        AI Confidence: {preventiveCareConfidence}%
                    </Badge>
                </CardContent>
            </Card>
        </div>
    )
}
