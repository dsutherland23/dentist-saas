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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Download, DollarSign, CreditCard, Calendar, CheckCircle2, XCircle, Clock, Loader2, ArrowUpRight, ReceiptText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function PaymentsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [payments, setPayments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInvoicesLoading, setIsInvoicesLoading] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])
    const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newPayment, setNewPayment] = useState({
        invoice_id: "",
        amount_paid: "",
        payment_method: "credit_card",
        transaction_id: ""
    })

    const fetchPayments = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/payments')
            if (res.ok) {
                const data = await res.json()
                setPayments(data)
            }
        } catch (error) {
            console.error("Error fetching payments:", error)
            toast.error("Failed to load payments")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchInvoices = async () => {
        setIsInvoicesLoading(true)
        try {
            const res = await fetch('/api/invoices')
            if (res.ok) {
                const data = await res.json()
                setInvoices(data.filter((inv: any) => inv.status !== 'paid'))
            }
        } catch (error) {
            console.error("Error fetching invoices:", error)
        } finally {
            setIsInvoicesLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [])

    useEffect(() => {
        if (isRecordDialogOpen) {
            fetchInvoices()
        }
    }, [isRecordDialogOpen])

    const handleRecordPayment = async () => {
        if (!newPayment.invoice_id || !newPayment.amount_paid) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPayment)
            })

            if (res.ok) {
                toast.success("Payment recorded successfully")
                setIsRecordDialogOpen(false)
                setNewPayment({
                    invoice_id: "",
                    amount_paid: "",
                    payment_method: "credit_card",
                    transaction_id: ""
                })
                fetchPayments()
            } else {
                throw new Error("Failed to record payment")
            }
        } catch (error) {
            toast.error("Error recording payment")
        } finally {
            setIsSubmitting(false)
        }
    }

    const exportToCSV = () => {
        if (payments.length === 0) {
            toast.error("No data to export")
            return
        }

        const headers = ["Patient", "Invoice #", "Method", "Amount", "Date", "Status", "Transaction ID"]
        const data = filteredPayments.map(p => [
            `${p.invoice?.patient?.first_name} ${p.invoice?.patient?.last_name}`,
            p.invoice?.invoice_number,
            p.payment_method,
            p.amount_paid,
            new Date(p.payment_date).toLocaleDateString(),
            p.status,
            p.transaction_id || "N/A"
        ])

        const csvContent = [headers, ...data].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Export started")
    }

    const filteredPayments = payments.filter(payment => {
        const patientName = `${payment.invoice?.patient?.first_name} ${payment.invoice?.patient?.last_name}`.toLowerCase()
        return patientName.includes(searchQuery.toLowerCase()) ||
            payment.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const stats = {
        totalProcessed: payments.reduce((acc, curr) => acc + Number(curr.amount_paid), 0),
        successCount: payments.filter(p => p.status === 'succeeded' || p.status === 'paid').length,
        avgTicket: payments.length > 0 ? payments.reduce((acc, curr) => acc + Number(curr.amount_paid), 0) / payments.length : 0,
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'succeeded':
            case 'paid':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'failed':
                return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200'
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Payments & Transactions</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Monitor revenue and manage patient transactions</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        className="backdrop-blur-sm bg-white/50 border-slate-200 text-slate-700"
                        onClick={exportToCSV}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Record New Payment</DialogTitle>
                                <DialogDescription>
                                    Manually record a payment received from a patient.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Invoice</label>
                                    <Select
                                        onValueChange={(v) => {
                                            const inv = invoices.find(i => i.id === v)
                                            setNewPayment(prev => ({
                                                ...prev,
                                                invoice_id: v,
                                                amount_paid: inv?.total_amount || ""
                                            }))
                                        }}
                                        value={newPayment.invoice_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isInvoicesLoading ? "Loading invoices..." : "Select pending invoice..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {invoices.map((inv) => (
                                                <SelectItem key={inv.id} value={inv.id}>
                                                    {inv.invoice_number} - {inv.patient.first_name} {inv.patient.last_name} (${inv.total_amount})
                                                </SelectItem>
                                            ))}
                                            {invoices.length === 0 && !isInvoicesLoading && (
                                                <p className="text-xs p-2 text-slate-500">No pending invoices found</p>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount Received</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            className="pl-9"
                                            placeholder="0.00"
                                            value={newPayment.amount_paid}
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, amount_paid: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Payment Method</label>
                                        <Select
                                            defaultValue="credit_card"
                                            onValueChange={(v) => setNewPayment(prev => ({ ...prev, payment_method: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="check">Check</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Transaction ID</label>
                                        <Input
                                            placeholder="Optional"
                                            value={newPayment.transaction_id}
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, transaction_id: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRecordDialogOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-teal-600 hover:bg-teal-700"
                                    onClick={handleRecordPayment}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                                    Confirm Payment
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                        <DollarSign className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalProcessed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="text-emerald-600 font-medium">+12.5%</span> vs last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Confirmed transactions</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.avgTicket.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 mt-1">Revenue per patient</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Methods</CardTitle>
                        <CreditCard className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-slate-500 mt-1">Active channels</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="shadow-sm overflow-hidden min-w-0">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                            <CardTitle className="text-lg">Recent Transactions</CardTitle>
                            <CardDescription>A list of all processed payments and their current status</CardDescription>
                        </div>
                        <div className="relative w-full min-w-0 sm:w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by patient, invoice or ID..."
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
                            <TableRow className="bg-slate-50 border-none">
                                <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                                <TableHead className="font-semibold text-slate-700">Invoice #</TableHead>
                                <TableHead className="font-semibold text-slate-700">Method</TableHead>
                                <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {payment.invoice?.patient?.first_name} {payment.invoice?.patient?.last_name}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                                ID: {payment.transaction_id || "Cash"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {payment.invoice?.invoice_number}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="text-sm capitalize">{payment.payment_method?.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">
                                        ${Number(payment.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusVariant(payment.status)}>
                                            {payment.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>View Invoice</DropdownMenuItem>
                                                <DropdownMenuItem>Send Receipt</DropdownMenuItem>
                                                <DropdownMenuItem>Issue Refund</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                    Flag Transaction
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredPayments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <DollarSign className="h-8 w-8 text-slate-200" />
                                            <p>No transactions found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
