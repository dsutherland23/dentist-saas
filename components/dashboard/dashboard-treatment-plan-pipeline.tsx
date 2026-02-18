"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ClipboardList, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/fetch-client"

interface PlanSummary {
    status: string
    count: number
    label: string
}

const STATUS_LABELS: Record<string, string> = {
    draft: "Draft",
    presented: "Sent",
    accepted: "Accepted",
    partially_accepted: "Partially accepted",
    declined: "Declined",
}

export function DashboardTreatmentPlanPipeline({ refreshKey = 0 }: { refreshKey?: number }) {
    const [byStatus, setByStatus] = useState<PlanSummary[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res = await fetchWithAuth("/api/treatment-plans")
                if (res.ok) {
                    const data = await res.json()
                    const plans = Array.isArray(data) ? data : []
                    const countByStatus: Record<string, number> = {}
                    plans.forEach((p: { status?: string }) => {
                        const s = p.status || "draft"
                        countByStatus[s] = (countByStatus[s] || 0) + 1
                    })
                    const summary = Object.entries(countByStatus).map(([status, count]) => ({
                        status,
                        count,
                        label: STATUS_LABELS[status] || status,
                    }))
                    setByStatus(summary)
                } else {
                    setByStatus([])
                }
            } catch {
                setByStatus([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [refreshKey])

    return (
        <div className="dashboard-panel">
            <div className="dashboard-panel-header flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Treatment plan pipeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">By status</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-teal-600 -mr-2"
                    onClick={() => router.push("/reports")}
                >
                    View all
                    <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden />
                </Button>
            </div>
            <div className="dashboard-panel-body">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
                    </div>
                ) : byStatus.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" aria-hidden />
                        <p className="text-sm font-medium">No treatment plans</p>
                        <p className="text-xs mt-0.5">Plans will appear here by status</p>
                    </div>
                ) : (
                    <ul className="space-y-2" role="list">
                        {byStatus.map(({ status, count, label }) => (
                            <li
                                key={status}
                                className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors"
                            >
                                <span className="text-sm font-medium text-slate-700">{label}</span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                                        status === "accepted" || status === "partially_accepted"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : status === "presented"
                                              ? "bg-amber-50 text-amber-700"
                                              : "bg-slate-100 text-slate-700"
                                    }`}
                                >
                                    {count}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
