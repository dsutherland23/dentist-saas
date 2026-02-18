"use client"

import { useEffect, useState } from "react"
import { AlertCircle, FileText, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/financial-utils"
import { fetchWithAuth } from "@/lib/fetch-client"
import { useRouter } from "next/navigation"

interface UnpaidInvoiceAlert {
    id: string
    invoice_number: string | null
    balance_due: number
    due_date: string | null
    patient_name: string
}

export function DashboardAlertsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
    const [alerts, setAlerts] = useState<UnpaidInvoiceAlert[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res = await fetchWithAuth("/api/dashboard/alerts")
                if (res.ok) {
                    const data = await res.json()
                    setAlerts(data.unpaidInvoices ?? [])
                } else {
                    setAlerts([])
                }
            } catch {
                setAlerts([])
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
                    <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Unpaid invoices and action items</p>
                </div>
            </div>
            <div className="dashboard-panel-body">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="py-6 text-center text-slate-500">
                        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" aria-hidden />
                        <p className="text-sm font-medium">No alerts</p>
                        <p className="text-xs mt-0.5">Unpaid invoices will appear here</p>
                    </div>
                ) : (
                    <ul className="space-y-2" role="list">
                        {alerts.slice(0, 5).map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
                                    onClick={() => router.push("/billing")}
                                >
                                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-4 w-4 text-amber-700" aria-hidden />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {item.invoice_number || "Invoice"} · {item.patient_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatCurrency(item.balance_due)} due
                                            {item.due_date
                                                ? ` · ${new Date(item.due_date).toLocaleDateString("en-US")}`
                                                : ""}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
