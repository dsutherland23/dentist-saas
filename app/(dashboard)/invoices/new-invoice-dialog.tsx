"use client"

import { useState, useEffect } from "react"
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

interface NewInvoiceDialogProps {
    patients?: any[]
    defaultPatientId?: string
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function NewInvoiceDialog({ patients: initialPatients, defaultPatientId, onSuccess, trigger }: NewInvoiceDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [patients, setPatients] = useState<any[]>(initialPatients || [])
    const [newInvoice, setNewInvoice] = useState({
        patient_id: defaultPatientId || "",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: "", quantity: 1, unit_price: 0 }]
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
        if (open && defaultPatientId) {
            setNewInvoice(prev => ({ ...prev, patient_id: defaultPatientId }))
        }
    }, [open, defaultPatientId])

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
                body: JSON.stringify(newInvoice)
            })

            if (res.ok) {
                toast.success("Invoice created successfully")
                setOpen(false)
                setNewInvoice({
                    patient_id: "",
                    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    items: [{ description: "", quantity: 1, unit_price: 0 }]
                })
                if (onSuccess) onSuccess()
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
