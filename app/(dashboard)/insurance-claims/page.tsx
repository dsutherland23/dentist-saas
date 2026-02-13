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
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedClaim, setSelectedClaim] = useState<any>(null)

    const [newClaim, setNewClaim] = useState({
        patient_id: "",
        invoice_id: "none",
        insurance_provider: "",
        policy_number: "",
        amount_claimed: 0
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

    useEffect(() => {
        fetchClaims()
        fetchPatients()
        fetchInvoices()
    }, [])

    const handleCreateClaim = async () => {
        if (!newClaim.patient_id || !newClaim.insurance_provider || newClaim.amount_claimed <= 0) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/insurance-claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClaim)
            })

            if (res.ok) {
                toast.success("Insurance claim submitted successfully")
                setIsCreateDialogOpen(false)
                setNewClaim({
                    patient_id: "",
                    invoice_id: "none",
                    insurance_provider: "",
                    policy_number: "",
                    amount_claimed: 0
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
        return patientName.includes(searchQuery.toLowerCase()) ||
            claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.insurance_provider.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
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
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Insurance Claims</h1>
                    <p className="text-slate-500 mt-1">Track and manage insurance submissions and payouts</p>
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
                                        const inv = invoices.find(i => i.id === v)
                                        setNewClaim(prev => ({
                                            ...prev,
                                            invoice_id: v,
                                            amount_claimed: inv ? Number(inv.total_amount) : prev.amount_claimed
                                        }))
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select invoice..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No related invoice</SelectItem>
                                        {invoices.filter(i => i.patient_id === newClaim.patient_id).map(i => (
                                            <SelectItem key={i.id} value={i.id}>{i.invoice_number} (${i.total_amount})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Insurance Provider</Label>
                                <Input
                                    placeholder="e.g. Delta Dental, MetLife"
                                    value={newClaim.insurance_provider}
                                    onChange={(e) => setNewClaim(prev => ({ ...prev, insurance_provider: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Policy Number</Label>
                                <Input
                                    placeholder="Policy/Member ID"
                                    value={newClaim.policy_number}
                                    onChange={(e) => setNewClaim(prev => ({ ...prev, policy_number: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Amount Claimed</Label>
                                <Input
                                    type="number"
                                    value={newClaim.amount_claimed}
                                    onChange={(e) => setNewClaim(prev => ({ ...prev, amount_claimed: parseFloat(e.target.value) || 0 }))}
                                />
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
                        <div className="text-2xl font-bold">${claims.reduce((acc, c) => acc + Number(c.amount_claimed), 0).toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Value of all active submissions</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{claims.filter(c => c.status === 'approved' && new Date(c.updated_at).toDateString() === new Date().toDateString()).length}</div>
                        <p className="text-xs text-slate-500 mt-1">Claims approved in the last 24h</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Claim History</CardTitle>
                            <CardDescription>Monitor and manage all insurance claim status</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by patient, claim #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
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
                                            <span className="font-medium">{claim.insurance_provider}</span>
                                            <span className="text-xs text-slate-500">{claim.policy_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">${Number(claim.amount_claimed).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusVariant(claim.status)}>
                                            {claim.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{new Date(claim.submitted_at).toLocaleDateString()}</TableCell>
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
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'approved')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /> Mark Approved
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'paid')}>
                                                    <Banknote className="h-4 w-4 mr-2 text-emerald-600" /> Mark Paid
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateClaimStatus(claim.id, 'rejected')}>
                                                    <XCircle className="h-4 w-4 mr-2 text-rose-600" /> Mark Rejected
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
                                        <p className="font-medium">{selectedClaim.insurance_provider}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Policy Number</Label>
                                        <p className="font-medium font-mono">{selectedClaim.policy_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1 text-right">
                                        <Label className="text-slate-500 text-xs text-uppercase tracking-wider">Amount Claimed</Label>
                                        <p className="text-2xl font-bold text-teal-600">${Number(selectedClaim.amount_claimed).toLocaleString()}</p>
                                    </div>
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
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => updateClaimStatus(selectedClaim.id, 'approved')}>
                                    Approve Claim
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateClaimStatus(selectedClaim.id, 'paid')}>
                                    Full Payout Received
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
