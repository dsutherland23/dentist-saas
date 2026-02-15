"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, DollarSign, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { NewInvoiceDialog } from "@/app/(dashboard)/invoices/new-invoice-dialog"

interface CheckoutPaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: {
        id: string
        patientName: string
        treatment_type: string
        patient_id: string
    }
    onConfirmPaid: () => void
}

export function CheckoutPaymentModal({
    open,
    onOpenChange,
    appointment,
    onConfirmPaid,
}: CheckoutPaymentModalProps) {
    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [markingPaid, setMarkingPaid] = useState(false)
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false)
    const [defaultItems, setDefaultItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([])

    useEffect(() => {
        if (!open || !appointment?.treatment_type) return
        fetch("/api/treatments")
            .then((res) => (res.ok ? res.json() : []))
            .then((treatments: { name: string; price: number }[]) => {
                const match = Array.isArray(treatments)
                    ? treatments.find(
                          (t) =>
                              t.name?.toLowerCase() === appointment.treatment_type?.toLowerCase() ||
                              t.name?.toLowerCase().includes(appointment.treatment_type?.toLowerCase() ?? "")
                      )
                    : null
                const price = match ? Number(match.price) : 0
                setDefaultItems([
                    { description: appointment.treatment_type || "Appointment", quantity: 1, unit_price: price },
                ])
            })
            .catch(() => setDefaultItems([{ description: appointment.treatment_type || "Appointment", quantity: 1, unit_price: 0 }]))
    }, [open, appointment?.treatment_type])

    useEffect(() => {
        if (!open || !appointment?.id) return
        setLoading(true)
        fetch(`/api/invoices?appointment_id=${appointment.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then(async (data) => {
                if (data) return data
                // Fallback: fetch most recent unpaid invoice for patient
                const res = await fetch(`/api/invoices?patient_id=${appointment.patient_id}`)
                if (!res.ok) return null
                const list = await res.json()
                const unpaid = Array.isArray(list) ? list.find((i: any) => i.status !== "paid" && i.status !== "cancelled") : null
                return unpaid || null
            })
            .then((data) => setInvoice(data))
            .catch(() => setInvoice(null))
            .finally(() => setLoading(false))
    }, [open, appointment?.id, appointment?.patient_id])

    const handleMarkPaid = async () => {
        if (!invoice) return
        setMarkingPaid(true)
        try {
            const res = await fetch("/api/invoices", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: invoice.id, status: "paid" }),
            })
            if (!res.ok) throw new Error("Failed to mark paid")
            toast.success("Payment recorded. Visit completed.")
            onConfirmPaid()
            onOpenChange(false)
        } catch {
            toast.error("Failed to record payment")
        } finally {
            setMarkingPaid(false)
        }
    }

    const amount = invoice?.total_amount != null ? Number(invoice.total_amount) : null
    const isPaid = invoice?.status === "paid"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-teal-600" />
                        Payment confirmation
                    </DialogTitle>
                    <DialogDescription>
                        Confirm payment to complete the visit for {appointment?.patientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                        </div>
                    ) : invoice ? (
                        <>
                            <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                                <p className="text-sm font-medium text-slate-900">{appointment?.patientName}</p>
                                <p className="text-xs text-slate-600">{appointment?.treatment_type}</p>
                                <p className="text-xl font-bold text-teal-600">
                                    Amount due: ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Invoice {invoice.invoice_number} · Status: {invoice.status?.toUpperCase()}
                                </p>
                            </div>

                            {!isPaid && (
                                <div className="flex flex-col gap-2">
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link href={`/invoices?id=${invoice.id}`} target="_blank">
                                            <FileText className="h-4 w-4 mr-2" />
                                            View invoice
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Link>
                                    </Button>
                                    <Button
                                        className="w-full bg-teal-600 hover:bg-teal-700"
                                        onClick={handleMarkPaid}
                                        disabled={markingPaid}
                                    >
                                        {markingPaid ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        Mark as paid & complete visit
                                    </Button>
                                </div>
                            )}
                            {isPaid && (
                                <p className="text-sm text-emerald-600 font-medium">Invoice already paid. You can complete the visit.</p>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                No invoice linked to this appointment. Create an invoice to complete checkout.
                            </p>
                            <NewInvoiceDialog
                                open={isNewInvoiceOpen}
                                onOpenChange={setIsNewInvoiceOpen}
                                defaultPatientId={appointment.patient_id}
                                defaultItems={
                                    defaultItems.length > 0
                                        ? defaultItems
                                        : [{ description: appointment?.treatment_type || "Appointment", quantity: 1, unit_price: 0 }]
                                }
                                appointmentId={appointment.id}
                                onSuccess={(created) => {
                                    setIsNewInvoiceOpen(false)
                                    if (created) {
                                        setInvoice(created)
                                        toast.success("Invoice created. You can now mark as paid.")
                                    }
                                }}
                                trigger={
                                    <Button variant="outline" className="w-full" type="button">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Create New Invoice
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
