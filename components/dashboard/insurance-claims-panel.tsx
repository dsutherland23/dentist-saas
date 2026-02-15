"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    Clock,
    ShieldCheck,
    TrendingUp,
    FileX,
    Loader2,
    ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/financial-utils"

interface InsurancePanelData {
    claimsSubmitted: {
        count: number
        value: number
    }
    claimsPending14Plus: {
        count: number
        value: number
    }
    deniedClaims: {
        count: number
        value: number
    }
    avgDaysToPayment: number
    expectedVsActual: {
        totalClaimed: number
        totalPaid: number
        reimbursementRate: number
    }
    alerts: Array<{
        type: string
        severity: string
        message: string
        count: number
    }>
}

export function InsuranceClaimsPanel() {
    const [data, setData] = useState<InsurancePanelData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/dashboard/insurance-panel")
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error("Error fetching insurance panel data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-panel">
                <div className="dashboard-panel-body flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </div>
        )
    }

    if (!data) {
        return null
    }

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Insurance & claims</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Status and reimbursement</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900 -mr-2"
                    onClick={() => router.push("/insurance-claims")}
                >
                    View all
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Button>
            </div>
            <div className="dashboard-panel-body">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left: Claims Overview */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Claims Overview
                        </h3>
                        
                        {/* Submitted this month */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                            <div className="flex items-start justify-between mb-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <Badge variant="outline" className="bg-white text-xs">
                                    This Month
                                </Badge>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                                {data.claimsSubmitted.count}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                {formatCurrency(data.claimsSubmitted.value)} submitted
                            </p>
                        </div>

                        {/* Pending > 14 days */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
                            <div className="flex items-start justify-between mb-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs border-amber-200">
                                    {data.claimsPending14Plus.count}
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-amber-900">
                                Pending 14+ Days
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                                {formatCurrency(data.claimsPending14Plus.value)} outstanding
                            </p>
                        </div>

                        {/* Denied claims */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100">
                            <div className="flex items-start justify-between mb-2">
                                <FileX className="h-5 w-5 text-rose-600" />
                                <Badge variant="outline" className="bg-rose-100 text-rose-800 text-xs border-rose-200">
                                    {data.deniedClaims.count}
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-rose-900">
                                Denied Claims
                            </p>
                            <p className="text-xs text-rose-700 mt-1">
                                {formatCurrency(data.deniedClaims.value)} rejected
                            </p>
                        </div>
                    </div>

                    {/* Center: Payment Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Payment Timeline
                        </h3>
                        
                        <div className="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 text-center">
                            <Clock className="h-10 w-10 mx-auto text-teal-600 mb-3" />
                            <p className="text-4xl font-bold text-teal-900 mb-2">
                                {data.avgDaysToPayment}
                            </p>
                            <p className="text-sm font-medium text-teal-700">
                                Average Days to Payment
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                    Reimbursement Rate
                                </p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-emerald-900">
                                    {data.expectedVsActual.reimbursementRate.toFixed(1)}%
                                </p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1 text-xs text-emerald-700">
                                <div className="flex justify-between">
                                    <span>Total Claimed:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(data.expectedVsActual.totalClaimed)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Paid:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(data.expectedVsActual.totalPaid)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Alerts */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Alert Indicators
                        </h3>
                        
                        {data.alerts.length === 0 ? (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 text-center">
                                <ShieldCheck className="h-12 w-12 mx-auto text-emerald-600 mb-3" />
                                <p className="text-sm font-medium text-emerald-900">
                                    All Clear!
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">
                                    No urgent claims issues
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.alerts.map((alert, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border ${
                                            alert.severity === 'high'
                                                ? 'bg-rose-50 border-rose-200'
                                                : 'bg-amber-50 border-amber-200'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertCircle
                                                className={`h-5 w-5 mt-0.5 ${
                                                    alert.severity === 'high'
                                                        ? 'text-rose-600'
                                                        : 'text-amber-600'
                                                }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-sm font-medium ${
                                                        alert.severity === 'high'
                                                            ? 'text-rose-900'
                                                            : 'text-amber-900'
                                                    }`}
                                                >
                                                    {alert.message}
                                                </p>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className={`h-auto p-0 text-xs mt-1 ${
                                                        alert.severity === 'high'
                                                            ? 'text-rose-600 hover:text-rose-700'
                                                            : 'text-amber-600 hover:text-amber-700'
                                                    }`}
                                                    onClick={() => router.push("/insurance-claims")}
                                                >
                                                    Review Claims →
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
