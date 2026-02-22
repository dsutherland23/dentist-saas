"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ShieldCheck, AlertCircle, Calendar, Calculator, Loader2 } from "lucide-react"
import { format } from "date-fns"

type Snapshot = {
    active?: boolean
    annual_max?: number
    annual_max_remaining?: number
    deductible?: number
    deductible_remaining?: number
    coverage_percentage?: number
    plan_type?: string
    waiting_periods?: Array<{ description?: string; from?: string; to?: string }>
    verified_at?: string
} | null

interface EligibilityPanelClientProps {
    policyId: string
    eligibilitySnapshot: Snapshot
    verificationStatus: string | null
    verifiedAt: string | null
}

function useEstimator(policyId: string, snapshot: Snapshot) {
    const [fee, setFee] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        insurance_estimate: number
        patient_portion: number
        capped_by_annual_max?: boolean
    } | null>(null)
    const run = async () => {
        const amount = parseFloat(fee)
        if (!Number.isFinite(amount) || amount <= 0) return
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch("/api/insurance/estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    policy_id: policyId,
                    procedure_fee: amount,
                    coverage_percentage: snapshot?.coverage_percentage ?? 80,
                    deductible_remaining: snapshot?.deductible_remaining ?? 0,
                    annual_max_remaining: snapshot?.annual_max_remaining ?? 0,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setResult({
                    insurance_estimate: data.insurance_estimate,
                    patient_portion: data.patient_portion,
                    capped_by_annual_max: data.capped_by_annual_max,
                })
            }
        } finally {
            setLoading(false)
        }
    }
    return { fee, setFee, loading, result, run }
}

export function EligibilityPanelClient({
    policyId,
    eligibilitySnapshot,
    verificationStatus,
    verifiedAt,
}: EligibilityPanelClientProps) {
    const snap = eligibilitySnapshot
    const isVerified = verificationStatus === "verified" && snap
    const estimator = useEstimator(policyId, snap)

    if (!isVerified || !snap) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-medium">Eligibility not verified</p>
                            <p className="text-sm text-amber-800">
                                Verify eligibility from the patient insurance page to see coverage details.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <CoverageStatusBadge active={snap.active} />
                {verifiedAt && (
                    <span className="text-sm text-slate-500">
                        Verified {format(new Date(verifiedAt), "PPp")}
                    </span>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <AnnualMaxCard
                    annualMax={snap.annual_max}
                    remaining={snap.annual_max_remaining}
                />
                <DeductibleCard
                    deductible={snap.deductible}
                    remaining={snap.deductible_remaining}
                />
            </div>

            <CoverageBreakdownTable
                coveragePercentage={snap.coverage_percentage}
                planType={snap.plan_type}
            />

            {snap.waiting_periods && snap.waiting_periods.length > 0 && (
                <WaitingPeriodNotice periods={snap.waiting_periods} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Estimate patient portion
                    </CardTitle>
                    <CardDescription>Enter procedure fee to estimate insurance vs patient responsibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-2">
                            <Label>Procedure fee ($)</Label>
                            <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                value={estimator.fee}
                                onChange={(e) => estimator.setFee(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={estimator.run}
                            disabled={estimator.loading || !estimator.fee}
                        >
                            {estimator.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Calculate
                        </Button>
                    </div>
                    {estimator.result && (
                        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Insurance estimate</p>
                                <p className="text-xl font-bold text-teal-600">
                                    ${estimator.result.insurance_estimate.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Patient portion</p>
                                <p className="text-xl font-bold text-slate-900">
                                    ${estimator.result.patient_portion.toLocaleString()}
                                </p>
                            </div>
                            {estimator.result.capped_by_annual_max && (
                                <p className="col-span-2 text-xs text-amber-700">
                                    Estimate capped by remaining annual maximum.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function CoverageStatusBadge({ active }: { active?: boolean }) {
    return (
        <Badge
            variant="outline"
            className={
                active
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
            }
        >
            <ShieldCheck className="h-3 w-3 mr-1" />
            {active ? "Active" : "Inactive"}
        </Badge>
    )
}

function AnnualMaxCard({
    annualMax,
    remaining,
}: {
    annualMax?: number
    remaining?: number
}) {
    const used = annualMax != null && remaining != null ? annualMax - remaining : null
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Annual maximum</CardTitle>
                <CardDescription>Benefits remaining this period</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-teal-600">
                    ${(remaining ?? 0).toLocaleString()}
                    {annualMax != null && (
                        <span className="text-sm font-normal text-slate-500">
                            {" "}
                            of ${annualMax.toLocaleString()}
                        </span>
                    )}
                </div>
                {used != null && used > 0 && (
                    <p className="text-xs text-slate-500 mt-1">Used: ${used.toLocaleString()}</p>
                )}
            </CardContent>
        </Card>
    )
}

function DeductibleCard({
    deductible,
    remaining,
}: {
    deductible?: number
    remaining?: number
}) {
    const met = deductible != null && remaining != null && remaining <= 0
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Deductible</CardTitle>
                <CardDescription>Amount remaining before coverage</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                    ${(remaining ?? deductible ?? 0).toLocaleString()}
                    {deductible != null && (
                        <span className="text-sm font-normal text-slate-500">
                            {" "}
                            of ${deductible.toLocaleString()}
                        </span>
                    )}
                </div>
                {met && (
                    <p className="text-xs text-emerald-600 mt-1">Deductible met</p>
                )}
            </CardContent>
        </Card>
    )
}

function CoverageBreakdownTable({
    coveragePercentage,
    planType,
}: {
    coveragePercentage?: number
    planType?: string
}) {
    const rows = [
        { label: "Plan type", value: planType ?? "—" },
        { label: "Coverage (typical)", value: coveragePercentage != null ? `${coveragePercentage}%` : "—" },
    ]
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Coverage breakdown</CardTitle>
                <CardDescription>Plan details from last verification</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((r) => (
                            <TableRow key={r.label}>
                                <TableCell className="font-medium">{r.label}</TableCell>
                                <TableCell className="text-right">{r.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function WaitingPeriodNotice({
    periods,
}: {
    periods: Array<{ description?: string; from?: string; to?: string }>
}) {
    return (
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    Waiting periods
                </CardTitle>
                <CardDescription>Limitations that may affect coverage</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {periods.map((p, i) => (
                        <li key={i} className="flex flex-wrap gap-x-2">
                            {p.description && <span>{p.description}</span>}
                            {(p.from || p.to) && (
                                <span className="text-slate-500">
                                    {p.from && `From ${p.from}`}
                                    {p.from && p.to && " "}
                                    {p.to && `To ${p.to}`}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
