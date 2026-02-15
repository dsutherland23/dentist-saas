"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign,
    TrendingUp,
    Clock,
    CreditCard,
    Loader2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/financial-utils"
import { fetchWithAuth } from "@/lib/fetch-client"

interface CashFlowData {
    arAging: {
        buckets: Array<{
            bucket: string
            count: number
            amount: number
        }>
        totalOutstanding: number
        totalInvoices: number
    }
    collectionMetrics: {
        totalBilled: number
        totalCollected: number
        collectionRate: number
        outstandingBalance: number
    }
    paymentMethodBreakdown: Record<string, number>
    avgPaymentTurnaround: number
    cashFlowForecast: {
        next30Days: number
        scheduledAppointments: number
    }
}

interface CashFlowPanelProps {
    refreshKey?: number
}

export function CashFlowPanel({ refreshKey = 0 }: CashFlowPanelProps) {
    const [data, setData] = useState<CashFlowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetchWithAuth("/api/dashboard/financial-metrics")
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || `Failed to load: ${res.status}`)
            }
            const json = await res.json()
            setData(json)
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to load financial metrics"
            setError(message)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [refreshKey])

    if (loading && !data) {
        return (
            <div className="dashboard-panel">
                <div className="dashboard-panel-body flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="dashboard-panel">
                <div className="dashboard-panel-body flex flex-col items-center justify-center py-16 gap-4">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                    <p className="text-sm text-slate-600 text-center">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchData}>Try again</Button>
                </div>
            </div>
        )
    }

    if (!data) {
        return null
    }

    const collectionRate = Number(data.collectionMetrics?.collectionRate) ?? 0
    const avgTurnaround = Number(data.avgPaymentTurnaround) ?? 0
    const paymentMethods = data.paymentMethodBreakdown && typeof data.paymentMethodBreakdown === "object"
        ? Object.entries(data.paymentMethodBreakdown)
        : []

    const getBucketColor = (bucket: string) => {
        switch (bucket) {
            case 'current':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case '0-30':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case '31-60':
                return 'bg-amber-100 text-amber-800 border-amber-200'
            case '61-90':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case '90+':
                return 'bg-rose-100 text-rose-800 border-rose-200'
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header">
                <h3 className="text-sm font-semibold text-slate-900">Cash flow & collections</h3>
                <p className="text-xs text-slate-500 mt-0.5">Financial health and payment metrics</p>
            </div>
            <div className="dashboard-panel-body">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* AR Aging Breakdown */}
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Accounts Receivable Aging
                        </h3>
                        <div className="space-y-3">
                            {(data.arAging?.buckets ?? []).map((bucket) => (
                                <div key={bucket.bucket} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`${getBucketColor(bucket.bucket)} font-mono text-xs`}>
                                            {bucket.bucket === 'current' ? 'Current' : `${bucket.bucket} days`}
                                        </Badge>
                                        <span className="text-sm text-slate-700">
                                            {bucket.count} invoice{bucket.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">
                                        {formatCurrency(bucket.amount)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900">Total Outstanding</span>
                                <span className="text-lg font-bold text-teal-600">
                                    {formatCurrency(data.arAging?.totalOutstanding ?? 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Collection Metrics */}
                    <div className="space-y-4">
                        <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-5 w-5 text-teal-600" />
                                <p className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                                    Collection Rate
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-teal-900 mb-1">
                                {collectionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-teal-700">
                                {formatCurrency(data.collectionMetrics?.totalCollected ?? 0)} collected
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                    Avg Turnaround
                                </p>
                            </div>
                            <p className="text-3xl font-bold text-blue-900 mb-1">
                                {avgTurnaround}
                            </p>
                            <p className="text-xs text-blue-700">
                                days to payment
                            </p>
                        </div>
                    </div>

                    {/* Payment Methods & Forecast */}
                    <div className="space-y-4">
                        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="h-5 w-5 text-purple-600" />
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                                    Payment Methods
                                </p>
                            </div>
                            <div className="space-y-2">
                                {paymentMethods.length === 0 ? (
                                    <p className="text-xs text-purple-600">No payments this month</p>
                                ) : (
                                    paymentMethods.map(([method, amount]) => (
                                        <div key={method} className="flex items-center justify-between text-xs">
                                            <span className="text-purple-700 capitalize">{method}:</span>
                                            <span className="font-semibold text-purple-900">
                                                {formatCurrency(Number(amount) || 0)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                    30-Day Forecast
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-emerald-900 mb-1">
                                {formatCurrency(Number(data.cashFlowForecast?.next30Days) ?? 0)}
                            </p>
                            <p className="text-xs text-emerald-700">
                                {Number(data.cashFlowForecast?.scheduledAppointments) ?? 0} scheduled appointments
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
