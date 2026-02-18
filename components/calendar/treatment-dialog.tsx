"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface Treatment {
    id: string
    name: string
    price: number
}

interface TreatmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    dentists: Array<{ id: string; first_name?: string; last_name: string }>
    availableTreatments: Treatment[]
    currentUserId?: string
}

interface PlanItem {
    treatment_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

export function TreatmentDialog({
    open,
    onOpenChange,
    patientId,
    dentists,
    availableTreatments,
    currentUserId
}: TreatmentDialogProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [treatmentDialogTab, setTreatmentDialogTab] = useState<"plan" | "record">("plan")
    const [newPlanData, setNewPlanData] = useState({
        plan_name: "",
        notes: "",
        dentist_id: currentUserId || "",
        selectedItems: [] as PlanItem[]
    })
    const [treatmentData, setTreatmentData] = useState({
        dentist_id: currentUserId || "",
        appointment_id: "",
        items: [{ procedures_performed: "", diagnosis: "", notes: "" }]
    })

    const addPlanItem = (treatment: Treatment) => {
        const newItem: PlanItem = {
            treatment_id: treatment.id,
            description: treatment.name,
            quantity: 1,
            unit_price: treatment.price,
            total_price: treatment.price
        }
        setNewPlanData(prev => ({ ...prev, selectedItems: [...prev.selectedItems, newItem] }))
    }

    const removePlanItem = (index: number) => {
        setNewPlanData(prev => ({
            ...prev,
            selectedItems: prev.selectedItems.filter((_, i) => i !== index)
        }))
    }

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch("/api/treatment-plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: patientId,
                    plan_name: newPlanData.plan_name,
                    dentist_id: newPlanData.dentist_id,
                    notes: newPlanData.notes,
                    items: newPlanData.selectedItems
                })
            })
            if (res.ok) {
                toast.success("Treatment plan created")
                onOpenChange(false)
                setNewPlanData({ plan_name: "", notes: "", dentist_id: currentUserId || "", selectedItems: [] })
                router.refresh()
            } else {
                const error = await res.json()
                toast.error(error.error || "Failed to create treatment plan")
            }
        } catch (error) {
            toast.error("Failed to create treatment plan")
        } finally {
            setIsSaving(false)
        }
    }

    const handleRecordTreatment = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch("/api/treatments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: patientId,
                    ...treatmentData
                })
            })
            if (res.ok) {
                toast.success("Treatment recorded")
                onOpenChange(false)
                setTreatmentData({
                    dentist_id: currentUserId || "",
                    appointment_id: "",
                    items: [{ procedures_performed: "", diagnosis: "", notes: "" }]
                })
                router.refresh()
            } else {
                const error = await res.json()
                toast.error(error.error || "Failed to record treatment")
            }
        } catch (error) {
            toast.error("Failed to record treatment")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Treatment</DialogTitle>
                    <DialogDescription>Create a treatment plan (proposal) or record treatments performed.</DialogDescription>
                </DialogHeader>
                <Tabs value={treatmentDialogTab} onValueChange={(v) => setTreatmentDialogTab(v as "plan" | "record")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="plan">Treatment plan</TabsTrigger>
                        <TabsTrigger value="record">Record treatment</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plan" className="mt-4 space-y-4">
                        <form id="treatment-plan-form" onSubmit={handleCreatePlan}>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Plan name</Label>
                                    <Input 
                                        placeholder="e.g. Comprehensive Care Plan" 
                                        value={newPlanData.plan_name} 
                                        onChange={e => setNewPlanData(prev => ({ ...prev, plan_name: e.target.value }))} 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Add treatments</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableTreatments.filter(t => !newPlanData.selectedItems.some(i => i.treatment_id === t.id)).map(t => (
                                            <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => addPlanItem(t)}>
                                                + {t.name}
                                            </Button>
                                        ))}
                                        {availableTreatments.length === 0 && <p className="text-sm text-slate-500">No treatments in catalog.</p>}
                                    </div>
                                </div>
                                {newPlanData.selectedItems.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Selected items</Label>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {newPlanData.selectedItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                                                    <span>{item.description} × {item.quantity} — ${item.total_price.toFixed(2)}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => removePlanItem(idx)}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Dentist</Label>
                                    <Select value={newPlanData.dentist_id || undefined} onValueChange={val => setNewPlanData(prev => ({ ...prev, dentist_id: val }))}>
                                        <SelectTrigger><SelectValue placeholder="Select dentist" /></SelectTrigger>
                                        <SelectContent className="z-[100]" position="popper">
                                            {dentists.length === 0 ? (
                                                <div className="py-2 px-2 text-sm text-slate-500">No dentists available</div>
                                            ) : (
                                                dentists.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.last_name}</SelectItem>)
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes (optional)</Label>
                                    <Textarea 
                                        placeholder="Notes..." 
                                        value={newPlanData.notes} 
                                        onChange={e => setNewPlanData(prev => ({ ...prev, notes: e.target.value }))} 
                                        rows={2} 
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isSaving || newPlanData.selectedItems.length === 0} className="bg-teal-600">
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create plan
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    <TabsContent value="record" className="mt-4 space-y-4">
                        <form id="treatment-record-form" onSubmit={handleRecordTreatment}>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Procedures performed</Label>
                                    <Textarea 
                                        placeholder="e.g. Cleaning, filling..." 
                                        value={treatmentData.items[0].procedures_performed} 
                                        onChange={e => setTreatmentData(prev => ({
                                            ...prev,
                                            items: [{ ...prev.items[0], procedures_performed: e.target.value }]
                                        }))} 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Diagnosis</Label>
                                    <Textarea 
                                        placeholder="Clinical diagnosis..." 
                                        value={treatmentData.items[0].diagnosis} 
                                        onChange={e => setTreatmentData(prev => ({
                                            ...prev,
                                            items: [{ ...prev.items[0], diagnosis: e.target.value }]
                                        }))} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dentist</Label>
                                    <Select value={treatmentData.dentist_id || undefined} onValueChange={val => setTreatmentData(prev => ({ ...prev, dentist_id: val }))}>
                                        <SelectTrigger><SelectValue placeholder="Select dentist" /></SelectTrigger>
                                        <SelectContent className="z-[100]" position="popper">
                                            {dentists.length === 0 ? (
                                                <div className="py-2 px-2 text-sm text-slate-500">No dentists available</div>
                                            ) : (
                                                dentists.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.last_name}</SelectItem>)
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes (optional)</Label>
                                    <Textarea 
                                        placeholder="Additional notes..." 
                                        value={treatmentData.items[0].notes} 
                                        onChange={e => setTreatmentData(prev => ({
                                            ...prev,
                                            items: [{ ...prev.items[0], notes: e.target.value }]
                                        }))} 
                                        rows={2} 
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record treatment
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
