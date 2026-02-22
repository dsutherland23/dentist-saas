"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScanLine, ShieldCheck, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DocumentScanFlow } from "@/components/patients/document-scan-flow"
import { runOcr, parseInsuranceFields } from "@/lib/document-ocr"

const RELATIONSHIPS = ["self", "spouse", "child", "other"]
const PLAN_TYPES = ["PPO", "HMO", "DHMO", "Indemnity", "Other"]

type Provider = { id: string; name: string; payer_id?: string }
type Policy = {
    id: string
    provider_id: string | null
    member_id: string | null
    group_number: string | null
    subscriber_name: string | null
    relationship: string | null
    plan_type: string | null
    verification_status: string | null
    eligibility_snapshot: Record<string, unknown> | null
    provider?: { id: string; name: string; payer_id?: string }
}

interface PatientInsuranceFormProps {
    patientId: string
    providers: Provider[]
    initialPolicies: Policy[]
}

export function PatientInsuranceForm({
    patientId,
    providers,
    initialPolicies,
}: PatientInsuranceFormProps) {
    const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
    const [activePolicyId, setActivePolicyId] = useState<string | null>(
        initialPolicies[0]?.id ?? null
    )
    const [form, setForm] = useState({
        provider_id: "",
        member_id: "",
        group_number: "",
        subscriber_name: "",
        relationship: "",
        plan_type: "",
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [scanOpen, setScanOpen] = useState(false)

    const activePolicy = policies.find((p) => p.id === activePolicyId)

    useEffect(() => {
        if (activePolicy) {
            setForm({
                provider_id: activePolicy.provider_id ?? "",
                member_id: activePolicy.member_id ?? "",
                group_number: activePolicy.group_number ?? "",
                subscriber_name: activePolicy.subscriber_name ?? "",
                relationship: activePolicy.relationship ?? "",
                plan_type: activePolicy.plan_type ?? "",
            })
        } else {
            setForm({
                provider_id: "",
                member_id: "",
                group_number: "",
                subscriber_name: "",
                relationship: "",
                plan_type: "",
            })
        }
    }, [activePolicyId, activePolicy])

    const fetchPolicies = async () => {
        try {
            const res = await fetch(`/api/patients/${patientId}/policies`)
            if (res.ok) {
                const data = await res.json()
                setPolicies(data)
                if (data.length && !activePolicyId) setActivePolicyId(data[0].id)
            }
        } catch {
            toast.error("Failed to load policies")
        }
    }

    const handleSave = async () => {
        if (activePolicy) {
            setIsSaving(true)
            try {
                const res = await fetch(
                    `/api/patients/${patientId}/policies/${activePolicy.id}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(form),
                    }
                )
                if (res.ok) {
                    toast.success("Insurance policy updated")
                    fetchPolicies()
                } else throw new Error("Update failed")
            } catch {
                toast.error("Failed to update policy")
            } finally {
                setIsSaving(false)
            }
        } else {
            if (!form.provider_id && !form.member_id) {
                toast.error("Select a provider or enter member ID")
                return
            }
            setIsSaving(true)
            try {
                const res = await fetch(`/api/patients/${patientId}/policies`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider_id: form.provider_id || null,
                        member_id: form.member_id || null,
                        group_number: form.group_number || null,
                        subscriber_name: form.subscriber_name || null,
                        relationship: form.relationship || null,
                        plan_type: form.plan_type || null,
                    }),
                })
                if (res.ok) {
                    toast.success("Insurance policy added")
                    fetchPolicies()
                    setForm({
                        provider_id: "",
                        member_id: "",
                        group_number: "",
                        subscriber_name: "",
                        relationship: "",
                        plan_type: "",
                    })
                } else throw new Error("Create failed")
            } catch {
                toast.error("Failed to add policy")
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleVerifyEligibility = async () => {
        if (!activePolicy?.id) {
            toast.error("Select or save a policy first")
            return
        }
        setIsVerifying(true)
        try {
            const res = await fetch("/api/insurance/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ policy_id: activePolicy.id }),
            })
            if (res.ok) {
                const data = await res.json()
                toast.success("Eligibility verified")
                fetchPolicies()
                if (data.eligibility) {
                    window.location.href = `/insurance/${activePolicy.id}/eligibility`
                }
            } else throw new Error("Verify failed")
        } catch {
            toast.error("Eligibility verification failed")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleApplyScan = (fields: { insuranceProvider: string; policyOrMemberId: string }) => {
        const provider = providers.find(
            (p) => p.name.toLowerCase().includes(fields.insuranceProvider.toLowerCase())
        )
        setForm((prev) => ({
            ...prev,
            provider_id: provider?.id ?? prev.provider_id,
            member_id: fields.policyOrMemberId || prev.member_id,
        }))
        toast.success("Form filled from scan. Review and save.")
    }

    const handleDeletePolicy = async (policyId: string) => {
        if (!confirm("Remove this insurance policy?")) return
        try {
            const res = await fetch(
                `/api/patients/${patientId}/policies/${policyId}`,
                { method: "DELETE" }
            )
            if (res.ok) {
                toast.success("Policy removed")
                setPolicies((p) => p.filter((x) => x.id !== policyId))
                setActivePolicyId(policies[0]?.id ?? null)
            } else throw new Error("Delete failed")
        } catch {
            toast.error("Failed to remove policy")
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Insurance policies</CardTitle>
                            <CardDescription>Add or edit insurance and verify eligibility</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScanOpen(true)}
                        >
                            <ScanLine className="h-4 w-4 mr-2" />
                            Scan card
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs
                        value={activePolicyId ?? "new"}
                        onValueChange={(v) => setActivePolicyId(v === "new" ? null : v)}
                    >
                        <TabsList>
                            {policies.map((p) => (
                                <TabsTrigger key={p.id} value={p.id}>
                                    {p.provider?.name ?? "Insurance"} {p.member_id ? `• ${p.member_id}` : ""}
                                </TabsTrigger>
                            ))}
                            <TabsTrigger value="new">
                                <Plus className="h-4 w-4 mr-1" /> New
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activePolicyId ?? "new"} className="space-y-4 pt-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Insurance provider</Label>
                                    <Select
                                        value={form.provider_id || "none"}
                                        onValueChange={(v) =>
                                            setForm((prev) => ({ ...prev, provider_id: v === "none" ? "" : v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">— Select —</SelectItem>
                                            {providers.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Member ID</Label>
                                    <Input
                                        value={form.member_id}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, member_id: e.target.value }))
                                        }
                                        placeholder="Member ID"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Group number</Label>
                                    <Input
                                        value={form.group_number}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, group_number: e.target.value }))
                                        }
                                        placeholder="Group number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscriber name</Label>
                                    <Input
                                        value={form.subscriber_name}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, subscriber_name: e.target.value }))
                                        }
                                        placeholder="Subscriber name"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Relationship</Label>
                                    <Select
                                        value={form.relationship || "none"}
                                        onValueChange={(v) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                relationship: v === "none" ? "" : v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">—</SelectItem>
                                            {RELATIONSHIPS.map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {r}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Plan type</Label>
                                    <Select
                                        value={form.plan_type || "none"}
                                        onValueChange={(v) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                plan_type: v === "none" ? "" : v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Plan type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">—</SelectItem>
                                            {PLAN_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    className="bg-teal-600 hover:bg-teal-700"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                                {activePolicy && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleVerifyEligibility}
                                            disabled={isVerifying}
                                        >
                                            {isVerifying && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                            Verify eligibility
                                        </Button>
                                        {activePolicy.verification_status === "verified" && (
                                            <Button
                                                variant="outline"
                                                asChild
                                            >
                                                <a href={`/insurance/${activePolicy.id}/eligibility`}>
                                                    View eligibility
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => handleDeletePolicy(activePolicy.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <DocumentScanFlow
                open={scanOpen}
                onOpenChange={setScanOpen}
                mode="insurance"
                onApplyInsurance={handleApplyScan}
            />
        </>
    )
}
