"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { Plus, Search, MoreHorizontal, FileText, Download, Printer, Filter, Loader2, DollarSign, Clock, AlertCircle, Activity, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { NewInvoiceDialog } from "./new-invoice-dialog"

export default function InvoicesPage() {
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") ?? "")
    const [invoices, setInvoices] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [patients, setPatients] = useState<any[]>([])

    const [viewingInvoice, setViewingInvoice] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const fetchInvoices = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/invoices')
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error("Error fetching invoices:", error)
            toast.error("Failed to load invoices")
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

    useEffect(() => {
        fetchInvoices()
        fetchPatients()
    }, [])

    useEffect(() => {
        const q = searchParams?.get("q") ?? ""
        setSearchQuery(q)
    }, [searchParams])

    useEffect(() => {
        const id = searchParams?.get("id")
        if (!id) return
        fetch(`/api/invoices?id=${id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setViewingInvoice(data)
                    setIsDetailsOpen(true)
                }
            })
            .catch(() => toast.error("Error loading invoice details"))
    }, [searchParams?.get("id")])

    const handleArchiveInvoice = async (id: string) => {
        if (!confirm("Are you sure you want to archive this invoice? It will no longer appear in the active list.")) return

        try {
            const res = await fetch('/api/invoices', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'cancelled' })
            })

            if (res.ok) {
                toast.success("Invoice archived")
                fetchInvoices()
            }
        } catch (error) {
            toast.error("Error archiving invoice")
        }
    }

    const handleViewDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices?id=${id}`)
            if (res.ok) {
                const data = await res.json()
                setViewingInvoice(data)
                setIsDetailsOpen(true)
            }
        } catch (error) {
            toast.error("Error loading invoice details")
        }
    }

    const generatePDF = async (invoice: any, action: 'download' | 'print') => {
        try {
            console.log("Starting PDF generation for invoice:", invoice)
            const doc = new jsPDF()
            let startY = 20

            // Function to load image with timeout and error handling
            const loadImage = (url: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image()
                    img.crossOrigin = "anonymous"

                    const timeout = setTimeout(() => {
                        reject(new Error("Image load timeout"))
                    }, 5000)

                    img.onload = () => {
                        clearTimeout(timeout)
                        resolve(img)
                    }
                    img.onerror = (e) => {
                        clearTimeout(timeout)
                        console.error("Image load error details:", e)
                        reject(new Error("Image load failed"))
                    }
                    img.src = url
                })
            }

            // Add Logo if available
            if (invoice.clinic?.logo_url) {
                console.log("Attempting to load logo from URL:", invoice.clinic.logo_url)
                try {
                    const img = await loadImage(invoice.clinic.logo_url)
                    // Add image at top left
                    doc.addImage(img, 'PNG', 14, 10, 30, 30)
                    startY = 50 // Push text down if logo exists
                    console.log("Logo added successfully")
                } catch (e) {
                    console.error("Failed to load logo for PDF. Continuing without logo.", e)
                }
            } else {
                console.log("No logo URL found in invoice.clinic object")
            }

            // Header
            doc.setFontSize(22)
            doc.setTextColor(13, 148, 136) // Teal-600

            // Adjust title position based on logo presence
            // If logo is present (startY=50), keep title centered but ensure no overlap
            // If no logo (startY=20), title is at 20
            const titleY = invoice.clinic?.logo_url ? 25 : 20
            doc.text("DENTAL CLINIC INVOICE", 105, titleY, { align: 'center' })

            doc.setFontSize(10)
            doc.setTextColor(100)

            // Adjust info position
            const infoY = startY + 10

            doc.text(`Invoice #: ${invoice.invoice_number}`, 14, infoY)
            doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 14, infoY + 5)
            doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, infoY + 10)

            // Clinic Address (if we have it)
            if (invoice.clinic) {
                doc.setFontSize(10)
                doc.setTextColor(80)
                const clinicInfo = [
                    invoice.clinic.name,
                    invoice.clinic.address,
                    `${invoice.clinic.city || ''}, ${invoice.clinic.state || ''} ${invoice.clinic.zip || ''}`,
                    invoice.clinic.phone,
                    invoice.clinic.email
                ].filter(Boolean)

                doc.text(clinicInfo.join('\n'), 196, infoY, { align: 'right' })
            }

            // Patient Info
            doc.setTextColor(0)
            doc.setFontSize(12)
            doc.text("BILL TO:", 14, infoY + 25)
            doc.setFontSize(11)
            doc.text(`${invoice.patient?.first_name} ${invoice.patient?.last_name}`, 14, infoY + 32)
            doc.text(`${invoice.patient?.email}`, 14, infoY + 38)
            doc.text(`${invoice.patient?.phone || ""}`, 14, infoY + 44)

            // Table
            const tableData = invoice.items?.map((item: any) => [
                item.description || "Service",
                item.quantity?.toString() || "0",
                `$${Number(item.unit_price || 0).toFixed(2)}`,
                `$${Number(item.total || 0).toFixed(2)}`
            ]) || []

            autoTable(doc, {
                startY: infoY + 55,
                head: [['Description', 'Qty', 'Unit Price', 'Total']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [13, 148, 136] },
                styles: { fontSize: 10 },
            })

            // Summary
            const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : (infoY + 80)
            doc.setFontSize(14)
            doc.text(`Total Amount: $${Number(invoice.total_amount || 0).toFixed(2)}`, 140, finalY)

            console.log("Saving PDF...")
            if (action === 'download') {
                doc.save(`${invoice.invoice_number}.pdf`)
            } else {
                const pdfBlob = doc.output('bloburl')
                window.open(pdfBlob.toString(), '_blank')
            }
            console.log("PDF generation completed successfully")
        } catch (error) {
            console.error("CRITICAL ERROR in generatePDF:", error)
            toast.error("Failed to generate PDF. Check console for details.")
        }
    }

    const exportToCSV = () => {
        if (invoices.length === 0) {
            toast.error("No data to export")
            return
        }

        const headers = ["Invoice #", "Patient", "Status", "Amount", "Issue Date", "Due Date"]
        const csvContent = [
            headers.join(","),
            ...filteredInvoices.map(inv => [
                inv.invoice_number,
                `${inv.patient?.first_name} ${inv.patient?.last_name}`,
                inv.status,
                inv.total_amount,
                inv.issue_date,
                inv.due_date
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Export started")
    }

    const filteredInvoices = invoices.filter(invoice => {
        const patientName = `${invoice.patient?.first_name} ${invoice.patient?.last_name}`.toLowerCase()
        return patientName.includes(searchQuery.toLowerCase()) ||
            invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const stats = {
        totalOutstanding: invoices.filter(inv => inv.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total_amount), 0),
        paidToday: invoices.filter(inv => inv.status === 'paid' && new Date(inv.updated_at || inv.created_at).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + Number(curr.total_amount), 0),
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
    }

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'partial': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'sent': return 'bg-amber-100 text-amber-700 border-amber-200'
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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage billing, track payments, and generate reports</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/50 shrink-0" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <NewInvoiceDialog patients={patients} onSuccess={fetchInvoices} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                        <DollarSign className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalOutstanding.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Pending payments from all patients</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Today</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.paidToday.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Collected in the last 24 hours</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overdue}</div>
                        <p className="text-xs text-slate-500 mt-1">Requires follow-up</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm overflow-hidden border-slate-200 min-w-0">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="relative w-full min-w-0 sm:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by patient or invoice #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full min-w-0 bg-slate-50 border-none"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="bg-slate-50 border-none shrink-0">
                            <Filter className="mr-2 h-4 w-4 text-slate-500" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto min-w-0">
                    <Table className="min-w-[500px]">
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[120px]">Invoice #</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        {invoice.invoice_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invoice.patient?.first_name} {invoice.patient?.last_name}</span>
                                            <span className="text-xs text-slate-500">{invoice.patient?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-slate-600">
                                            <span>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                                            {invoice.due_date && <span className="text-xs">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ${Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusVariant(invoice.status)}>
                                            {invoice.status.toUpperCase()}
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
                                                <DropdownMenuItem onClick={() => handleViewDetails(invoice.id)}>
                                                    <FileText className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    fetch(`/api/invoices?id=${invoice.id}`).then(res => res.json()).then(data => generatePDF(data, 'download'))
                                                }}>
                                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    fetch(`/api/invoices?id=${invoice.id}`).then(res => res.json()).then(data => generatePDF(data, 'print'))
                                                }}>
                                                    <Printer className="mr-2 h-4 w-4" /> Print
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-rose-600 focus:text-rose-600"
                                                    onClick={() => handleArchiveInvoice(invoice.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Archive Invoice
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredInvoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Invoice {viewingInvoice?.invoice_number}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of services and patient information.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingInvoice && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
                                <div>
                                    <p className="text-slate-500">Patient</p>
                                    <p className="font-semibold text-slate-900">{viewingInvoice.patient?.first_name} {viewingInvoice.patient?.last_name}</p>
                                    <p className="text-slate-600">{viewingInvoice.patient?.email}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Dates</p>
                                    <p className="text-slate-900">Issued: {new Date(viewingInvoice.issue_date).toLocaleDateString()}</p>
                                    <p className="text-slate-900 font-medium text-rose-600">Due: {new Date(viewingInvoice.due_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingInvoice.items?.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-medium">${Number(item.total).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col items-end gap-2 pr-4">
                                <div className="flex justify-between w-48 text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span>${Number(viewingInvoice.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between w-48 text-lg font-bold text-slate-900 border-t pt-2">
                                    <span>Total</span>
                                    <span>${Number(viewingInvoice.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => generatePDF(viewingInvoice, 'print')}>
                            <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => generatePDF(viewingInvoice, 'download')}>
                            <Download className="h-4 w-4 mr-2" /> Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
