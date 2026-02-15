"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"

interface Treatment {
    id: string
    name: string
    price: number
    category?: string
}

interface InvoiceItem {
    description: string
    quantity: number
    unit_price: number
}

interface NewInvoiceDialogProps {
    patients?: any[]
    defaultPatientId?: string
    defaultItems?: InvoiceItem[]
    appointmentId?: string
    treatments?: Treatment[]
    onSuccess?: (invoice?: { id: string; invoice_number: string; total_amount: number }) => void
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function NewInvoiceDialog({ patients: initialPatients, defaultPatientId, defaultItems, appointmentId, treatments: initialTreatments, onSuccess, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: NewInvoiceDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [patients, setPatients] = useState<any[]>(initialPatients || [])
    const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments || [])
    const [newInvoice, setNewInvoice] = useState({
        patient_id: defaultPatientId || "",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: (defaultItems && defaultItems.length > 0) ? defaultItems : [{ description: "", quantity: 1, unit_price: 0 }]
    })

    useEffect(() => {
        if (!initialPatients) {
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
            fetchPatients()
        } else {
            setPatients(initialPatients)
        }
    }, [initialPatients])

    useEffect(() => {
        if (!initialTreatments && open) {
            fetch('/api/treatments')
                .then(res => res.ok ? res.json() : [])
                .then(data => setTreatments(Array.isArray(data) ? data : []))
                .catch(() => setTreatments([]))
        } else if (initialTreatments?.length) {
            setTreatments(initialTreatments)
        }
    }, [open, initialTreatments])

    useEffect(() => {
        if (open) {
            setNewInvoice(prev => ({
                ...prev,
                patient_id: defaultPatientId || prev.patient_id,
                items: (defaultItems && defaultItems.length > 0) ? defaultItems : prev.items
            }))
        }
    }, [open, defaultPatientId, defaultItems])

    const hasAutoFilled = useRef(false)
    useEffect(() => {
        if (!open) {
            hasAutoFilled.current = false
            return
        }
        // Skip auto-fill if defaultItems were provided (e.g. from checkout)
        if (defaultItems && defaultItems.length > 0 && defaultItems[0].description) {
            hasAutoFilled.current = true
            return
        }
        if (treatments.length > 0 && !hasAutoFilled.current) {
            hasAutoFilled.current = true
            const first = treatments[0]
            setNewInvoice(prev => ({
                ...prev,
                items: prev.items.length === 1 && !prev.items[0].description
                    ? [{ description: first.name, quantity: 1, unit_price: Number(first.price) }]
                    : prev.items
            }))
        }
    }, [open, treatments, defaultItems])

    const applyTreatmentToItem = (index: number, treatmentId: string) => {
        const t = treatments.find(x => x.id === treatmentId)
        if (!t) return
        const newItems = [...newInvoice.items]
        newItems[index] = { ...newItems[index], description: t.name, unit_price: Number(t.price) }
        setNewInvoice(prev => ({ ...prev, items: newItems }))
    }

    const handleCreateInvoice = async () => {
        if (!newInvoice.patient_id || newInvoice.items.some(i => !i.description || i.unit_price <= 0)) {
            toast.error("Please fill in all required fields correctly")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newInvoice,
                    ...(appointmentId && { appointment_id: appointmentId })
                })
            })

            if (res.ok) {
                const created = await res.json()
                toast.success("Invoice created successfully")
                setOpen(false)
                setNewInvoice({
                    patient_id: "",
                    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    items: [{ description: "", quantity: 1, unit_price: 0 }]
                })
                onSuccess?.(created)
            } else {
                throw new Error("Failed to create invoice")
            }
        } catch (error) {
            toast.error("Error creating invoice")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                        Generate a new billing invoice for a patient.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Select Patient</Label>
                        <Select
                            value={newInvoice.patient_id}
                            onValueChange={(value) => setNewInvoice(prev => ({ ...prev, patient_id: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select patient..." />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={newInvoice.due_date}
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Service Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNewInvoice(prev => ({
                                    ...prev,
                                    items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }]
                                }))}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </div>
                        {newInvoice.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg relative group">
                                {treatments.length > 0 && (
                                    <div className="col-span-12 space-y-2">
                                        <Label className="text-xs">From treatment catalog</Label>
                                        <Select
                                            value=""
                                            onValueChange={(val) => applyTreatmentToItem(index, val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select service from catalog..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {treatments.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name} — ${Number(t.price).toFixed(2)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="col-span-6 space-y-2">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        placeholder="Service description"
                                        value={item.description}
                                        onChange={(e) => {
                                            const newItems = [...newInvoice.items]
                                            newItems[index].description = e.target.value
                                            setNewInvoice(prev => ({ ...prev, items: newItems }))
                                        }}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs">Qty</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...newInvoice.items]
                                            newItems[index].quantity = parseInt(e.target.value) || 0
                                            setNewInvoice(prev => ({ ...prev, items: newItems }))
                                        }}
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label className="text-xs">Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => {
                                            const newItems = [...newInvoice.items]
                                            newItems[index].unit_price = parseFloat(e.target.value) || 0
                                            setNewInvoice(prev => ({ ...prev, items: newItems }))
                                        }}
                                    />
                                </div>
                                <div className="col-span-1 pb-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => {
                                            const newItems = newInvoice.items.filter((_, i) => i !== index)
                                            setNewInvoice(prev => ({ ...prev, items: newItems }))
                                        }}
                                        disabled={newInvoice.items.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center px-2">
                        <span className="font-semibold text-slate-600">Total Amount</span>
                        <span className="text-2xl font-bold text-teal-600">
                            ${newInvoice.items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0).toFixed(2)}
                        </span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={handleCreateInvoice}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
