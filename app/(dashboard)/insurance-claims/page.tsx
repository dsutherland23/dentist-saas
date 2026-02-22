"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Filter, Loader2, ShieldCheck, Clock, AlertCircle, FileCheck, ExternalLink, MoreHorizontal, CheckCircle2, XCircle, Banknote, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function InsuranceClaimsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [claims, setClaims] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [patientPolicies, setPatientPolicies] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedClaim, setSelectedClaim] = useState<any>(null)

    const [newClaim, setNewClaim] = useState({
        patient_id: "",
        invoice_id: "none",
        policy_id: "",
        total_amount: 0,
        insurance_estimate: "",
        patient_responsibility: ""
    })

    const fetchClaims = async () => {
        try {
            const res = await fetch('/api/insurance-claims')
            if (res.ok) {
                const data = await res.json()
                setClaims(data)
            }
        } catch (error) {
            console.error("Error fetching claims:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/patients')
            if (res.ok) {
                const data = await res.json()
                setPatients(data)
            }
        } catch (error) {
            console.error("Error fetching patients:", error)
        }
    }

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices')
            if (res.ok) {
                const data = await res.json()
                setInvoices(data.filter((inv: any) => inv.status !== 'cancelled'))
            }
        } catch (error) {
            console.error("Error fetching invoices:", error)
        }
    }

    const fetchPoliciesForPatient = async (patientId: string) => {
        if (!patientId) {
            setPatientPolicies([])
            return
        }
        try {
            const res = await fetch(`/api/patients/${patientId}/policies`)
            if (res.ok) {
                const data = await res.json()
                setPatientPolicies(data)
            } else {
                setPatientPolicies([])
            }
        } catch {
            setPatientPolicies([])
        }
    }

    useEffect(() => {
        fetchClaims()
        fetchPatients()
        fetchInvoices()
    }, [])

    useEffect(() => {
        fetchPoliciesForPatient(newClaim.patient_id)
    }, [newClaim.patient_id])

    const handleCreateClaim = async () => {
        if (!newClaim.patient_id || newClaim.total_amount <= 0) {
            toast.error("Please select a patient and enter amount claimed")
            return
        }

        setIsSubmitting(true)
        try {
            const payload: Record<string, unknown> = {
                patient_id: newClaim.patient_id,
                invoice_id: newClaim.invoice_id === "none" ? null : newClaim.invoice_id,
                total_amount: newClaim.total_amount,
            }
            if (newClaim.policy_id) payload.policy_id = newClaim.policy_id
            if (newClaim.insurance_estimate !== "") payload.insurance_estimate = parseFloat(newClaim.insurance_estimate)
            if (newClaim.patient_responsibility !== "") payload.patient_responsibility = parseFloat(newClaim.patient_responsibility)

            const res = await fetch('/api/insurance-claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Insurance claim submitted successfully")
                setIsCreateDialogOpen(false)
                setNewClaim({
                    patient_id: "",
                    invoice_id: "none",
                    policy_id: "",
                    total_amount: 0,
                    insurance_estimate: "",
                    patient_responsibility: ""
                })
                fetchClaims()
            } else {
                throw new Error("Failed to submit claim")
            }
        } catch (error) {
            toast.error("Error submitting claim")
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateClaimStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/insurance-claims', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })

            if (res.ok) {
                toast.success(`Claim status updated to ${status}`)
                fetchClaims()
                if (selectedClaim?.id === id) {
                    setIsDetailsDialogOpen(false)
                }
            } else {
                throw new Error("Failed to update claim")
            }
        } catch (error) {
            toast.error("Error updating claim status")
        }
    }

    const handleDeleteClaim = async (id: string) => {
        if (!confirm("Are you sure you want to delete this claim?")) return

        try {
            const res = await fetch(`/api/insurance-claims?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success("Claim deleted successfully")
                fetchClaims()
            }
        } catch (error) {
            toast.error("Error deleting claim")
        }
    }

    const filteredClaims = claims.filter(claim => {
        const patientName = `${claim.patient?.first_name} ${claim.patient?.last_name}`.toLowerCase()
        const providerName = (claim.policy as any)?.provider?.name ?? ""
        return patientName.includes(searchQuery.toLowerCase()) ||
            claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            providerName.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'denied': return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'resubmitted': return 'bg-violet-100 text-violet-700 border-violet-200'
            case 'partially_paid': return 'bg-sky-100 text-sky-700 border-sky-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Insurance Claims</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Track and manage insurance submissions and payouts</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Submit Claim
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Submit Insurance Claim</DialogTitle>
                            <DialogDescription>
                                Create a new claim submission for an insurance provider.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Patient</Label>
                                <Select
                                    value={newClaim.patient_id}
                                    onValueChange={(v) => setNewClaim(prev => ({ ...prev, patient_id: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Related Invoice (Optional)</Label>
                                <Select
                                    value={newClaim.invoice_id}
                                    onValueChange={(v) => {
                                        const inv = invoices.find((i: any) => i.id === v)
                                        setNewClaim(prev => ({
                                            ...prev,
                                            invoice_id: v,
                                            total_amount: inv ? Number(inv.total_amount) : prev.total_amount
                                        }))
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select invoice..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No related invoice</SelectItem>
                                        {invoices.filter((i: any) => i.patient_id === newClaim.patient_id).map((i: any) => (
                                            <SelectItem key={i.id} value={i.id}>{i.invoice_number} (${i.total_amount})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Insurance Policy (Optional)</Label>
                                <Select
                                    value={newClaim.policy_id || "none"}
                                    onValueChange={(v) => setNewClaim(prev => ({ ...prev, policy_id: v === "none" ? "" : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select policy..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No policy linked</SelectItem>
                                        {patientPolicies.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.provider?.name ?? "Provider"} — {p.member_id || p.group_number || p.id.slice(0, 8)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Total Amount Claimed</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={newClaim.total_amount || ""}
                                    onChange={(e) => setNewClaim(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-2">
                                    <Label>Insurance Estimate (Optional)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        placeholder="0"
                                        value={newClaim.insurance_estimate}
                                        onChange={(e) => setNewClaim(prev => ({ ...prev, insurance_estimate: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Patient Responsibility (Optional)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        placeholder="0"
                                        value={newClaim.patient_responsibility}
                                        onChange={(e) => setNewClaim(prev => ({ ...prev, patient_responsibility: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={handleCreateClaim}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Claim
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{claims.filter(c => c.status === 'pending').length}</div>
                        <p className="text-xs text-slate-500 mt-1">Awaiting response from providers</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Claimed</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${claims.reduce((acc, c) => acc + Number(c.total_amount ?? 0), 0).toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Value of all active submissions</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{claims.filter(c => c.status === 'paid' && new Date(c.updated_at).toDateString() === new Date().toDateString()).length}</div>
                        <p className="text-xs text-slate-500 mt-1">Claims paid today</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm min-w-0">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                            <CardTitle>Claim History</CardTitle>
                            <CardDescription>Monitor and manage all insurance claim status</CardDescription>
                        </div>
                        <div className="relative w-full min-w-0 sm:w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by patient, claim #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full min-w-0"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto min-w-0">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Claim #</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClaims.map((claim) => (
                                <TableRow key={claim.id}>
                                    <TableCell className="font-medium text-slate-900">{claim.claim_number}</TableCell>
                                    <TableCell>{claim.patient?.first_name} {claim.patient?.last_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{(claim.policy as any)?.provider?.name ?? "—"}</span>
                                            <span className="text-xs text-slate-500">{(claim.policy as any)?.member_id || (claim.policy as any)?.group_number || "—"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">${Number(claim.total_amount ?? 0).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusVariant(claim.status)}>
                                            {claim.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Manage Claim</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedClaim(claim)
                                                    setIsDetailsDialogOpen(true)
                                                }}>
                                                    <ExternalLink className="h-4 w-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-xs text-slate-500">Update Status</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'submitted')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /> Mark Submitted
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'paid')}>
                                                    <Banknote className="h-4 w-4 mr-2 text-emerald-600" /> Mark Paid
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'denied')}>
                                                    <XCircle className="h-4 w-4 mr-2 text-rose-600" /> Mark Denied
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDeleteClaim(claim.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Claim
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredClaims.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">No claims found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-8">
                            <div>
                                <DialogTitle>Claim Details: {selectedClaim?.claim_number}</DialogTitle>
                                <DialogDescription>Full submission breakdown and history</DialogDescription>
                            </div>
                            <Badge variant="outline" className={getStatusVariant(selectedClaim?.status || '')}>
                                {selectedClaim?.status?.toUpperCase()}
                            </Badge>
                        </div>
                    </DialogHeader>
                    {selectedClaim && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <Label className="text-slate-500 text-xs">Patient Information</Label>
                                    <p className="font-semibold text-lg">{selectedClaim.patient?.first_name} {selectedClaim.patient?.last_name}</p>
                                    <p className="text-sm text-slate-600">{selectedClaim.patient?.email}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <Label className="text-slate-500 text-xs">Submission Date</Label>
                                    <p className="font-medium">{new Date(selectedClaim.submitted_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-slate-500">Last updated: {new Date(selectedClaim.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Insurance Provider</Label>
                                        <p className="font-medium">{(selectedClaim.policy as any)?.provider?.name ?? '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Member / Group</Label>
                                        <p className="font-medium font-mono">{(selectedClaim.policy as any)?.member_id || (selectedClaim.policy as any)?.group_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1 text-right">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Total Amount</Label>
                                        <p className="text-2xl font-bold text-teal-600">${Number(selectedClaim.total_amount ?? 0).toLocaleString()}</p>
                                    </div>
                                    {selectedClaim.insurance_estimate != null && (
                                        <div className="space-y-1 text-right">
                                            <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Insurance Estimate</Label>
                                            <p className="font-medium">${Number(selectedClaim.insurance_estimate).toLocaleString()}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1 text-right">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Related Invoice</Label>
                                        <p className="font-medium">{selectedClaim.invoice?.invoice_number || 'None Linked'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedClaim.notes && (
                                <div className="space-y-1 p-3 bg-slate-100 rounded-lg">
                                    <Label className="text-slate-500 text-[10px] uppercase font-bold">Claim Notes</Label>
                                    <p className="text-sm text-slate-700 italic">"{selectedClaim.notes}"</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => updateClaimStatus(selectedClaim.id, 'submitted')}>
                                    Mark Submitted
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateClaimStatus(selectedClaim.id, 'paid')}>
                                    Mark Paid
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function Separator() {
    return <div className="h-px w-full bg-slate-200" />
}
