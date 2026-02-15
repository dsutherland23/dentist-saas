"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DollarSign,
    TrendingUp,
    FileText,
    Lightbulb,
    Calendar,
    User,
    Loader2,
    ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, calculateUnscheduledTreatmentValue, calculateTreatmentAcceptanceRate } from "@/lib/financial-utils"

interface TreatmentPlan {
    id: string
    patient_id: string
    patient_name: string
    status: string
    total_estimated_cost: number
    unscheduled_value: number
    items: any[]
}

export function RevenueIntelligencePanel() {
    const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/treatment-plans")
            if (res.ok) {
                const json = await res.json()
                setTreatmentPlans(json)
            }
        } catch (error) {
            console.error("Error fetching treatment plans:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="card-modern border-0">
                <CardHeader>
                    <CardTitle className="text-2xl">Revenue Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </CardContent>
            </Card>
        )
    }

    const unscheduledData = calculateUnscheduledTreatmentValue(treatmentPlans)
    const acceptanceData = calculateTreatmentAcceptanceRate(treatmentPlans)

    // Generate insights
    const insights: string[] = []
    
    if (unscheduledData.highValuePatients.length > 0) {
        const top3 = unscheduledData.highValuePatients.slice(0, 3)
        top3.forEach(patient => {
            insights.push(`${patient.patient_name} has ${formatCurrency(patient.value)} in unscheduled treatment`)
        })
    }

    if (acceptanceData.acceptanceRate < 70 && acceptanceData.totalProposed > 5) {
        insights.push(`Treatment acceptance rate at ${acceptanceData.acceptanceRate.toFixed(0)}% - consider follow-up strategy`)
    }

    if (unscheduledData.total > 10000) {
        insights.push(`${formatCurrency(unscheduledData.total)} in total unscheduled treatment value`)
    }

    return (
        <Card className="card-modern border-0">
            <CardHeader>
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-teal-600" />
                        Revenue Intelligence
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Treatment plan pipeline and opportunities
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left: Unscheduled Treatment Value */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 opacity-90" />
                            <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                                Unscheduled Treatment
                            </p>
                        </div>
                        <p className="text-4xl font-bold mb-2">
                            {formatCurrency(unscheduledData.total)}
                        </p>
                        <p className="text-sm opacity-90">
                            Potential revenue waiting to be scheduled
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/20 space-y-1 text-xs opacity-90">
                            {Object.entries(unscheduledData.byStatus).map(([status, value]) => (
                                <div key={status} className="flex justify-between">
                                    <span className="capitalize">{status}:</span>
                                    <span className="font-semibold">{formatCurrency(value as number)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Treatment Acceptance */}
                    <div className="space-y-4">
                        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                    Treatment Acceptance
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-blue-900 mb-2">
                                {acceptanceData.acceptanceRate.toFixed(1)}%
                            </p>
                            <div className="space-y-1 text-xs text-blue-700">
                                <div className="flex justify-between">
                                    <span>Accepted:</span>
                                    <span className="font-semibold">{acceptanceData.totalAccepted}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Proposed:</span>
                                    <span className="font-semibold">{acceptanceData.totalProposed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Declined:</span>
                                    <span className="font-semibold">{acceptanceData.totalDeclined}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-purple-600" />
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                                    Active Plans
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-purple-900 mb-1">
                                {treatmentPlans.filter(p => ['proposed', 'accepted', 'in_progress'].includes(p.status)).length}
                            </p>
                            <p className="text-xs text-purple-700">
                                treatment plans in pipeline
                            </p>
                        </div>
                    </div>

                    {/* Right: High-Value Patients */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                High-Value Opportunities
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-teal-600 hover:text-teal-700"
                                onClick={() => router.push("/patients")}
                            >
                                View All →
                            </Button>
                        </div>

                        {unscheduledData.highValuePatients.length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <User className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-600">
                                    No unscheduled treatments
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[220px]">
                                <div className="space-y-2">
                                    {unscheduledData.highValuePatients.slice(0, 10).map((patient) => (
                                        <div
                                            key={patient.patient_id}
                                            className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 hover:border-amber-200 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/patients/${patient.patient_id}`)}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {patient.patient_name}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Unscheduled value
                                                </p>
                                            </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-amber-900">
                                                        {formatCurrency(patient.value)}
                                                    </p>
                                                    <ExternalLink className="h-3 w-3 text-amber-600 ml-auto mt-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                {/* Smart Insights */}
                {insights.length > 0 && (
                    <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-indigo-900 mb-2">
                                    Smart Insights
                                </h3>
                                <ul className="space-y-1">
                                    {insights.map((insight, index) => (
                                        <li key={index} className="text-sm text-indigo-700 flex items-start gap-2">
                                            <span className="text-indigo-400 mt-1">•</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
