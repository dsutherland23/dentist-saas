"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    FileText,
    MessageSquare,
    Clock,
    Phone,
    Mail,
    MapPin,
    AlertTriangle,
    Activity,
    Plus,
    Users,
    Pencil,
    Trash2,
    FileIcon,
    ImageIcon,
    X,
    Loader2,
    ChevronDown,
    Download,
    Share2,
    ExternalLink
} from "lucide-react"
import { format } from "date-fns"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"
import { NewInvoiceDialog } from "../../invoices/new-invoice-dialog"
import { NewAppointmentDialog } from "../../calendar/new-appointment-dialog"
import { useRouter } from "next/navigation"

interface PatientProfileClientProps {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        status?: string;
        date_of_birth?: string;
        phone?: string;
        email?: string;
        address?: string;
        allergies?: string;
        medical_conditions?: string;
        insurance_provider?: string;
        insurance_policy_number?: string;
    }
    appointments: {
        id: string;
        start_time: string;
        treatment_type: string;
        status: string;
        checked_in_at?: string | null;
        checked_out_at?: string | null;
        dentists?: { last_name: string } | null;
    }[]
    treatments: {
        id: string;
        created_at: string;
        procedures_performed: string;
        diagnosis: string;
        notes: string;
        dentists?: { last_name: string } | null;
    }[]
    files: {
        id: string;
        name: string;
        type: string;
        file_path: string;
        created_at: string;
    }[]
    availableTreatments: {
        id: string;
        name: string;
        price: number;
        category: string;
    }[]
    dentists: {
        id: string;
        first_name: string;
        last_name: string;
        role: string;
    }[]
    currentUserId: string;
}

export default function PatientProfileClient({ patient, appointments, treatments, files, availableTreatments, dentists, currentUserId }: PatientProfileClientProps) {
    const router = useRouter()
    const [isAlertsOpen, setIsAlertsOpen] = useState(false)
    const [isInsuranceOpen, setIsInsuranceOpen] = useState(false)
    const [isContactOpen, setIsContactOpen] = useState(false)
    const [isTreatmentOpen, setIsTreatmentOpen] = useState(false)
    const [treatmentDialogTab, setTreatmentDialogTab] = useState<"plan" | "record">("plan")
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
    const [isFileOpen, setIsFileOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
    const [createdInvoice, setCreatedInvoice] = useState<{ id: string; invoice_number: string; total_amount: number } | null>(null)
    const [patientInvoices, setPatientInvoices] = useState<{ id: string; invoice_number: string; total_amount: number; status: string; created_at: string }[]>([])

    // Form States
    const [alertsData, setAlertsData] = useState({
        allergies: patient.allergies || "",
        medical_conditions: patient.medical_conditions || ""
    })

    const [contactData, setContactData] = useState({
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || ""
    })

    const [insuranceData, setInsuranceData] = useState({
        insurance_provider: patient.insurance_provider || "",
        insurance_policy_number: patient.insurance_policy_number || ""
    })

    const [treatmentData, setTreatmentData] = useState({
        dentist_id: currentUserId,
        appointment_id: "",
        items: [{ procedures_performed: "", diagnosis: "", notes: "" }] as { procedures_performed: string; diagnosis: string; notes: string }[]
    })

    const [fileData, setFileData] = useState<{
        name: string;
        type: string;
        file: File | null;
    }>({
        name: "",
        type: "document",
        file: null
    })
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [recordDetail, setRecordDetail] = useState<"appointment" | "treatment" | null>(null)
    const [recordData, setRecordData] = useState<typeof appointments[0] | typeof treatments[0] | null>(null)
    const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])
    const [plansLoading, setPlansLoading] = useState(false)
    const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null)
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
    const [newPlanData, setNewPlanData] = useState({
        plan_name: "",
        notes: "",
        dentist_id: currentUserId,
        selectedItems: [] as { treatment_id: string; description: string; quantity: number; unit_price: number; total_price: number }[]
    })

    const fetchTreatmentPlans = async () => {
        setPlansLoading(true)
        try {
            const res = await fetch(`/api/treatment-plans?patient_id=${patient.id}`)
            if (res.ok) {
                const data = await res.json()
                setTreatmentPlans(Array.isArray(data) ? data : [])
            }
        } catch {
            toast.error("Failed to load treatment plans")
        } finally {
            setPlansLoading(false)
        }
    }

    const handlePlanStatusChange = async (planId: string, status: string) => {
        setUpdatingPlanId(planId)
        try {
            const res = await fetch("/api/treatment-plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: planId, status })
            })
            if (res.ok) {
                toast.success("Plan status updated")
                fetchTreatmentPlans()
                router.refresh()
            } else {
                const err = await res.json().catch(() => ({}))
                toast.error(err?.error || "Failed to update status")
            }
        } catch {
            toast.error("Failed to update plan status")
        } finally {
            setUpdatingPlanId(null)
        }
    }

    const handleItemAcceptanceChange = async (itemId: string, acceptance_status: string) => {
        setUpdatingItemId(itemId)
        try {
            const res = await fetch(`/api/treatment-plans/items/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ acceptance_status })
            })
            if (res.ok) {
                toast.success("Item status updated")
                fetchTreatmentPlans()
                router.refresh()
            } else {
                toast.error("Failed to update item")
            }
        } catch {
            toast.error("Failed to update item status")
        } finally {
            setUpdatingItemId(null)
        }
    }

    const handleAcceptAllItems = (plan: any) => {
        const items = plan.items || []
        items.forEach((it: any) => {
            if (it.acceptance_status !== "accepted") {
                handleItemAcceptanceChange(it.id, "accepted")
            }
        })
        handlePlanStatusChange(plan.id, "accepted")
    }
    const handleDeclineAllItems = (plan: any) => {
        const items = plan.items || []
        items.forEach((it: any) => {
            if (it.acceptance_status !== "declined") {
                handleItemAcceptanceChange(it.id, "declined")
            }
        })
        handlePlanStatusChange(plan.id, "declined")
    }

    const addPlanItem = (t: { id: string; name: string; price: number }) => {
        const qty = 1
        const unit = Number(t.price) || 0
        const total = unit * qty
        setNewPlanData(prev => ({
            ...prev,
            selectedItems: [...prev.selectedItems, { treatment_id: t.id, description: t.name, quantity: qty, unit_price: unit, total_price: total }]
        }))
    }
    const removePlanItem = (idx: number) => {
        setNewPlanData(prev => ({ ...prev, selectedItems: prev.selectedItems.filter((_, i) => i !== idx) }))
    }

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPlanData.plan_name.trim()) {
            toast.error("Enter a plan name")
            return
        }
        if (newPlanData.selectedItems.length === 0) {
            toast.error("Add at least one treatment")
            return
        }
        setIsSaving(true)
        try {
            const res = await fetch("/api/treatment-plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: patient.id,
                    plan_name: newPlanData.plan_name.trim(),
                    dentist_id: newPlanData.dentist_id || currentUserId,
                    notes: newPlanData.notes.trim() || undefined,
                    items: newPlanData.selectedItems.map(i => ({ ...i, notes: "" }))
                })
            })
            if (res.ok) {
                toast.success("Treatment plan created")
                setIsTreatmentOpen(false)
                setNewPlanData({ plan_name: "", notes: "", dentist_id: currentUserId, selectedItems: [] })
                fetchTreatmentPlans()
                router.refresh()
            } else {
                const err = await res.json().catch(() => ({}))
                toast.error(err?.error || "Failed to create plan")
            }
        } catch {
            toast.error("Failed to create treatment plan")
        } finally {
            setIsSaving(false)
        }
    }

    // Auto-refresh when user returns to this tab (e.g. after completing appointment on calendar)
    useEffect(() => {
        const onFocus = () => router.refresh()
        window.addEventListener("focus", onFocus)
        return () => window.removeEventListener("focus", onFocus)
    }, [router])

    useEffect(() => {
        setInsuranceData({
            insurance_provider: patient.insurance_provider || "",
            insurance_policy_number: patient.insurance_policy_number || ""
        })
    }, [patient.insurance_provider, patient.insurance_policy_number])

    useEffect(() => {
        fetch(`/api/invoices?patient_id=${patient.id}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setPatientInvoices(Array.isArray(data) ? data : []))
            .catch(() => setPatientInvoices([]))
    }, [patient.id])

    useEffect(() => {
        fetchTreatmentPlans()
    }, [patient.id])

    if (!patient) return <div>Patient not found</div>

    const handleUpdateAlerts = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch(`/api/patients/${patient.id}/medical-alerts`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertsData)
            })
            if (res.ok) {
                toast.success("Medical alerts updated")
                router.refresh()
            }
        } catch (error) {
            toast.error("Failed to update medical alerts")
        } finally {
            setIsSaving(false)
            setIsAlertsOpen(false)
        }
    }

    const handleUpdateContact = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch(`/api/patients/${patient.id}/contact`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            })
            if (res.ok) {
                toast.success("Contact information updated")
                router.refresh()
            }
        } catch (error) {
            toast.error("Failed to update contact info")
        } finally {
            setIsSaving(false)
            setIsContactOpen(false)
        }
    }

    const handleUpdateInsurance = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch(`/api/patients/${patient.id}/insurance`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insuranceData)
            })
            if (res.ok) {
                toast.success("Insurance information updated")
                const updated = await res.json()
                setInsuranceData({
                    insurance_provider: updated.insurance_provider ?? insuranceData.insurance_provider,
                    insurance_policy_number: updated.insurance_policy_number ?? insuranceData.insurance_policy_number
                })
                router.refresh()
            }
        } catch (error) {
            toast.error("Failed to update insurance")
        } finally {
            setIsSaving(false)
            setIsInsuranceOpen(false)
        }
    }

    const handleAddTreatment = async (e: React.FormEvent) => {
        e.preventDefault()
        const valid = treatmentData.items.filter(i => (i.procedures_performed || "").trim())
        if (valid.length === 0) {
            toast.error("Add at least one treatment with procedures")
            return
        }
        setIsSaving(true)
        let success = 0
        let failed = 0
        try {
            for (const item of valid) {
                const res = await fetch(`/api/patients/${patient.id}/treatments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        procedures_performed: item.procedures_performed.trim(),
                        diagnosis: item.diagnosis.trim() || undefined,
                        notes: item.notes.trim() || undefined,
                        dentist_id: treatmentData.dentist_id,
                        appointment_id: treatmentData.appointment_id || undefined
                    })
                })
                if (res.ok) success++
                else failed++
            }
            if (success > 0) {
                toast.success(failed > 0
                    ? `${success} treatment(s) added. ${failed} failed.`
                    : `${success} treatment record(s) added`)
                router.refresh()
                setTreatmentData({
                    dentist_id: currentUserId,
                    appointment_id: "",
                    items: [{ procedures_performed: "", diagnosis: "", notes: "" }]
                })
                setIsTreatmentOpen(false)
            }
            if (failed > 0 && success === 0) toast.error("Failed to add treatment records")
        } catch {
            toast.error("Failed to add treatment record(s)")
        } finally {
            setIsSaving(false)
        }
    }

    const addTreatmentRow = () => {
        setTreatmentData(prev => ({
            ...prev,
            items: [...prev.items, { procedures_performed: "", diagnosis: "", notes: "" }]
        }))
    }

    const removeTreatmentRow = (idx: number) => {
        if (treatmentData.items.length <= 1) return
        setTreatmentData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }))
    }

    const updateTreatmentItem = (idx: number, field: "procedures_performed" | "diagnosis" | "notes", value: string) => {
        setTreatmentData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
        }))
    }

    const MAX_FILE_SIZE_MB = 10
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileData.file) {
            toast.error("Please select a file")
            return
        }
        if (fileData.file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB`)
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", fileData.file)
            formData.append("name", fileData.name || fileData.file.name)
            formData.append("type", fileData.type || "document")

            const res = await fetch(`/api/patients/${patient.id}/files/upload`, {
                method: "POST",
                body: formData,
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const msg = data?.details || data?.error || "Upload failed"
                const hint = data?.hint ? ` ${data.hint}` : ""
                throw new Error(msg + hint)
            }
            toast.success("File uploaded successfully")
            router.refresh()
            setIsFileOpen(false)
            setFileData({ name: "", type: "document", file: null })
        } catch (error: unknown) {
            console.error(error)
            const err = error as { message?: string; error?: string }
            const msg = err?.message || err?.error || ""
            toast.error(msg ? `Upload failed: ${msg}` : "Failed to upload file. Check file size (max 10MB) and try again.")
        } finally {
            setIsUploading(false)
            setCameraStream(null)
        }
    }

    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                setCameraStream(stream)
                if (videoRef.current) videoRef.current.srcObject = stream
            })
            .catch(() => toast.error("Camera access denied or unavailable"))
    }

    const stopCamera = () => {
        cameraStream?.getTracks().forEach(t => t.stop())
        setCameraStream(null)
        if (videoRef.current) videoRef.current.srcObject = null
    }

    const capturePhoto = () => {
        if (!videoRef.current || !cameraStream) return
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
        canvas.toBlob(blob => {
            if (!blob) return
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
            setFileData(prev => ({ ...prev, file, type: prev.type === "xray" ? "xray" : "photo" }))
            stopCamera()
        }, "image/jpeg", 0.9)
    }

    const handleDeleteTreatment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this treatment record?")) return

        try {
            const res = await fetch(`/api/treatment-records/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success("Treatment record deleted")
                router.refresh()
            } else {
                toast.error("Failed to delete treatment record")
            }
        } catch (error) {
            toast.error("Error deleting treatment record")
        }
    }

    const openFileUrl = async (path: string) => {
        try {
            const res = await fetch(`/api/patients/${patient.id}/file-url?path=${encodeURIComponent(path)}`)
            if (!res.ok) throw new Error("Failed to get file URL")
            const { url } = await res.json()
            if (url) window.open(url, "_blank")
        } catch {
            toast.error("Could not open file")
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                        <AvatarFallback className="text-xl bg-teal-100 text-teal-700">
                            {patient.first_name[0]}{patient.last_name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl font-bold text-slate-900 font-outfit">{patient.first_name} {patient.last_name}</h1>
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                                {patient.status || 'Active'}
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1" /> DOB: {patient.date_of_birth ? format(new Date(patient.date_of_birth), "PPP") : "N/A"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Add <ChevronDown className="ml-1.5 h-4 w-4 opacity-80" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                            <DropdownMenuItem onSelect={() => setAppointmentDialogOpen(true)}>
                                <Calendar className="mr-2 h-4 w-4" /> New Appointment
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700 shadow-teal-100 shadow-lg"
                        onClick={() => {
                            setTreatmentDialogTab("plan")
                            setIsTreatmentOpen(true)
                        }}
                    >
                        <FileText className="mr-2 h-4 w-4" /> Treatment
                    </Button>
                    <NewAppointmentDialog
                        patients={[{ id: patient.id, first_name: patient.first_name, last_name: patient.last_name }]}
                        dentists={dentists.map(d => ({ id: d.id, first_name: d.first_name, last_name: d.last_name }))}
                        defaultPatientId={patient.id}
                        open={appointmentDialogOpen}
                        onOpenChange={setAppointmentDialogOpen}
                    />
                    <Button variant="outline" onClick={() => router.push(`/messages?patientId=${patient.id}`)}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <NewInvoiceDialog
                        defaultPatientId={patient.id}
                        treatments={availableTreatments}
                        open={invoiceDialogOpen}
                        onOpenChange={(open) => {
                            setInvoiceDialogOpen(open)
                            if (!open) setCreatedInvoice(null)
                        }}
                        onSuccess={(inv) => {
                            if (inv) {
                                setCreatedInvoice(inv)
                                setPatientInvoices(prev => [{
                                    id: inv.id,
                                    invoice_number: inv.invoice_number,
                                    total_amount: inv.total_amount,
                                    status: "sent",
                                    created_at: new Date().toISOString()
                                }, ...prev])
                            }
                            setInvoiceDialogOpen(false)
                        }}
                        trigger={
                            <Button variant="outline" onClick={() => setInvoiceDialogOpen(true)}>
                                <FileText className="mr-2 h-4 w-4" /> Invoice
                            </Button>
                        }
                    />
                    <Dialog open={!!createdInvoice} onOpenChange={(open) => !open && setCreatedInvoice(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Invoice created</DialogTitle>
                                <DialogDescription>
                                    {createdInvoice && (
                                        <>Invoice {createdInvoice.invoice_number} — ${Number(createdInvoice.total_amount).toFixed(2)}</>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            {createdInvoice && (
                                <div className="flex flex-col gap-3 py-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => window.open(`/invoices?id=${createdInvoice.id}`, "_blank")}
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" /> View invoice
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => {
                                            window.open(`/invoices?id=${createdInvoice.id}`, "_blank")
                                            setTimeout(() => window.print(), 300)
                                        }}
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Download / Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => {
                                            const url = typeof window !== "undefined" ? `${window.location.origin}/invoices?id=${createdInvoice.id}` : ""
                                            navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))
                                        }}
                                    >
                                        <Share2 className="mr-2 h-4 w-4" /> Copy link to share
                                    </Button>
                                </div>
                            )}
                            <DialogFooter>
                                <Button onClick={() => setCreatedInvoice(null)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {/* Unified Treatment dialog: Plan or Record */}
                    <Dialog open={isTreatmentOpen} onOpenChange={(open) => {
                        setIsTreatmentOpen(open)
                        if (!open) {
                            setTreatmentData({
                                dentist_id: currentUserId,
                                appointment_id: "",
                                items: [{ procedures_performed: "", diagnosis: "", notes: "" }]
                            })
                            setNewPlanData({ plan_name: "", notes: "", dentist_id: currentUserId, selectedItems: [] })
                        }
                    }}>
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
                                                <Input placeholder="e.g. Comprehensive Care Plan" value={newPlanData.plan_name} onChange={e => setNewPlanData(prev => ({ ...prev, plan_name: e.target.value }))} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Add treatments</Label>
                                                <div className="flex flex-wrap gap-1">
                                                    {availableTreatments.filter(t => !newPlanData.selectedItems.some(i => i.treatment_id === t.id)).map(t => (
                                                        <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => addPlanItem(t)}>
                                                            + {t.name}
                                                        </Button>
                                                    ))}
                                                    {availableTreatments.length === 0 && <p className="text-sm text-slate-500">No treatments in catalog. Add in Settings.</p>}
                                                </div>
                                            </div>
                                            {newPlanData.selectedItems.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Selected items</Label>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {newPlanData.selectedItems.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                                                                <span>{item.description} × {item.quantity} — ${item.total_price.toFixed(2)}</span>
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => removePlanItem(idx)}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label>Dentist</Label>
                                                <Select value={newPlanData.dentist_id} onValueChange={val => setNewPlanData(prev => ({ ...prev, dentist_id: val }))}>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {dentists.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.last_name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Notes (optional)</Label>
                                                <Textarea placeholder="Notes..." value={newPlanData.notes} onChange={e => setNewPlanData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <Button type="submit" disabled={isSaving || newPlanData.selectedItems.length === 0} className="bg-teal-600">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create plan
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </TabsContent>
                                <TabsContent value="record" className="mt-4">
                                    <form onSubmit={handleAddTreatment}>
                                        <div className="grid gap-4 py-2">
                                            {treatmentData.items.map((item, idx) => (
                                                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-slate-600">Treatment {idx + 1}</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => removeTreatmentRow(idx)} disabled={treatmentData.items.length <= 1} title="Remove">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                placeholder="Ex: Teeth cleaning, Filling..."
                                                                value={item.procedures_performed}
                                                                onChange={e => updateTreatmentItem(idx, "procedures_performed", e.target.value)}
                                                            />
                                                            {availableTreatments.length > 0 && (
                                                                <Select onValueChange={(val) => {
                                                                    const current = item.procedures_performed
                                                                    updateTreatmentItem(idx, "procedures_performed", current ? `${current}, ${val}` : val)
                                                                }}>
                                                                    <SelectTrigger className="h-9 w-[110px] shrink-0">
                                                                        <SelectValue placeholder="Add preset" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableTreatments.map(t => (
                                                                            <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input placeholder="Diagnosis (optional)" value={item.diagnosis} onChange={e => updateTreatmentItem(idx, "diagnosis", e.target.value)} />
                                                        <Input placeholder="Notes (optional)" value={item.notes} onChange={e => updateTreatmentItem(idx, "notes", e.target.value)} />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={addTreatmentRow}>
                                                <Plus className="mr-2 h-4 w-4" /> Add another
                                            </Button>
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <div className="space-y-2">
                                                    <Label>Dentist</Label>
                                                    <Select value={treatmentData.dentist_id} onValueChange={val => setTreatmentData(prev => ({ ...prev, dentist_id: val }))}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {dentists.map(dentist => (
                                                                <SelectItem key={dentist.id} value={dentist.id}>Dr. {dentist.last_name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Appointment (optional)</Label>
                                                    <Select value={treatmentData.appointment_id || "__none__"} onValueChange={val => setTreatmentData(prev => ({ ...prev, appointment_id: val === "__none__" ? "" : val }))}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Reference" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none__">None</SelectItem>
                                                            {appointments.map(apt => (
                                                                <SelectItem key={apt.id} value={apt.id}>{format(new Date(apt.start_time), 'MMM d')}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save {treatmentData.items.length > 1 ? `${treatmentData.items.length} records` : "record"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-w-0">

                {/* Left Column: Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Contact Info</CardTitle>
                            <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleUpdateContact}>
                                        <DialogHeader>
                                            <DialogTitle>Update Contact Info</DialogTitle>
                                            <DialogDescription>Update contact details for {patient.first_name}.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    value={contactData.phone}
                                                    onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={contactData.email}
                                                    onChange={e => setContactData({ ...contactData, email: e.target.value })}
                                                    placeholder="patient@example.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Input
                                                    id="address"
                                                    value={contactData.address}
                                                    onChange={e => setContactData({ ...contactData, address: e.target.value })}
                                                    placeholder="123 Main St, City, State"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center text-sm text-slate-600">
                                <Phone className="h-4 w-4 mr-3 text-teal-600" /> {patient.phone || "N/A"}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <Mail className="h-4 w-4 mr-3 text-teal-600" /> {patient.email || "N/A"}
                            </div>
                            <div className="flex items-start text-sm text-slate-600">
                                <MapPin className="h-4 w-4 mr-3 text-teal-600 mt-0.5" /> {patient.address || "N/A"}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Medical Alerts</CardTitle>
                            <Dialog open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleUpdateAlerts}>
                                        <DialogHeader>
                                            <DialogTitle>Update Medical Alerts</DialogTitle>
                                            <DialogDescription>Manage allergies and medical conditions for {patient.first_name}.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="allergies">Allergies</Label>
                                                <Textarea
                                                    id="allergies"
                                                    value={alertsData.allergies}
                                                    onChange={e => setAlertsData({ ...alertsData, allergies: e.target.value })}
                                                    placeholder="List known allergies..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="conditions">Medical Conditions</Label>
                                                <Textarea
                                                    id="conditions"
                                                    value={alertsData.medical_conditions}
                                                    onChange={e => setAlertsData({ ...alertsData, medical_conditions: e.target.value })}
                                                    placeholder="Heart disease, Diabetes, etc..."
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Alerts
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {patient.allergies ? (
                                <div className="flex items-start p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">
                                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold">Allergies:</span> {patient.allergies}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 italic">No known allergies recorded.</div>
                            )}

                            {patient.medical_conditions && (
                                <div className="flex items-start p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-100">
                                    <Activity className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold">Conditions:</span> {patient.medical_conditions}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card key={`ins-${patient.insurance_provider ?? "none"}`} className={`border-none shadow-sm ${!(patient.insurance_provider || insuranceData.insurance_provider) ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Insurance</CardTitle>
                            <Dialog open={isInsuranceOpen} onOpenChange={setIsInsuranceOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleUpdateInsurance}>
                                        <DialogHeader>
                                            <DialogTitle>Update Insurance Info</DialogTitle>
                                            <DialogDescription>Manage insurance provider and policy details for {patient.first_name}.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="provider">Insurance Provider</Label>
                                                <Input
                                                    id="provider"
                                                    value={insuranceData.insurance_provider}
                                                    onChange={e => setInsuranceData({ ...insuranceData, insurance_provider: e.target.value })}
                                                    placeholder="Blue Cross, Delta Dental, etc..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="policy">Policy Number</Label>
                                                <Input
                                                    id="policy"
                                                    value={insuranceData.insurance_policy_number}
                                                    onChange={e => setInsuranceData({ ...insuranceData, insurance_policy_number: e.target.value })}
                                                    placeholder="Policy or Member ID..."
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Insurance
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {!(patient.insurance_provider || insuranceData.insurance_provider) ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-start border border-amber-100 animate-pulse">
                                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">Missing Info:</span> Ask patient for insurance details.
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                                        onClick={() => setIsInsuranceOpen(true)}
                                    >
                                        Add Insurance Now
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="font-semibold text-slate-900">{patient.insurance_provider || insuranceData.insurance_provider}</div>
                                    <div className="text-sm text-slate-500 italic">Policy #{patient.insurance_policy_number || insuranceData.insurance_policy_number || "N/A"}</div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Tabs */}
                <div className="md:col-span-2 min-w-0">
                    <Tabs defaultValue="appointments" className="w-full min-w-0">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto flex-nowrap scrollbar-thin pb-px min-w-0">
                            <TabsTrigger value="appointments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600 shrink-0">Appointments</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600 shrink-0">Treatment History</TabsTrigger>
                            <TabsTrigger value="plans" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600 shrink-0">Treatment Plans</TabsTrigger>
                            <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600 shrink-0 whitespace-nowrap">Files & X-Rays</TabsTrigger>
                            <TabsTrigger value="invoices" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600 shrink-0 whitespace-nowrap">Invoices</TabsTrigger>
                        </TabsList>

                        <Dialog open={!!recordDetail} onOpenChange={(open) => { if (!open) { setRecordDetail(null); setRecordData(null) } }}>
                            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col items-center w-[calc(100vw-2rem)] sm:w-full">
                                <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full h-8 w-8" onClick={() => { setRecordDetail(null); setRecordData(null) }} aria-label="Close">
                                    <X className="h-4 w-4" />
                                </Button>
                                {recordDetail === "appointment" && recordData && "start_time" in recordData && (
                                    <div className="space-y-4 pt-6 w-full min-w-0">
                                        <DialogHeader>
                                            <DialogTitle>Appointment</DialogTitle>
                                            <DialogDescription>{format(new Date(recordData.start_time), "PPP 'at' p")}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3 text-sm">
                                            <p><span className="font-semibold text-slate-700">Treatment:</span> {recordData.treatment_type}</p>
                                            <p><span className="font-semibold text-slate-700">Status:</span> {getAppointmentStatusLabel(recordData.status)}</p>
                                            {recordData.checked_in_at && <p><span className="font-semibold text-slate-700">Checked in:</span> {format(new Date(recordData.checked_in_at), "PPp")}</p>}
                                            {recordData.checked_out_at && <p><span className="font-semibold text-slate-700">Checked out:</span> {format(new Date(recordData.checked_out_at), "PPp")}</p>}
                                            {recordData.dentists && <p><span className="font-semibold text-slate-700">Provider:</span> Dr. {recordData.dentists.last_name}</p>}
                                        </div>
                                        {patient.allergies && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                                                <span className="font-bold text-red-800">Allergies:</span> {patient.allergies}
                                            </div>
                                        )}
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                                            <span className="font-semibold text-slate-700">X-ray / images on file:</span> {files.some(f => f.type === "xray" || f.type === "photo") ? "Yes" : "No"}
                                        </div>
                                    </div>
                                )}
                                {recordDetail === "treatment" && recordData && "procedures_performed" in recordData && (
                                    <div className="space-y-4 pt-6 w-full min-w-0">
                                        <DialogHeader>
                                            <DialogTitle>Treatment record</DialogTitle>
                                            <DialogDescription>{format(new Date(recordData.created_at), "PPP")}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3 text-sm">
                                            <p><span className="font-semibold text-slate-700">Procedures:</span> {recordData.procedures_performed}</p>
                                            <p><span className="font-semibold text-slate-700">Diagnosis:</span> {recordData.diagnosis}</p>
                                            <p><span className="font-semibold text-slate-700">Notes:</span> {recordData.notes}</p>
                                            {recordData.dentists && <p><span className="font-semibold text-slate-700">Recorded by:</span> Dr. {recordData.dentists.last_name}</p>}
                                        </div>
                                        {patient.allergies && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                                                <span className="font-bold text-red-800">Allergies:</span> {patient.allergies}
                                            </div>
                                        )}
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                                            <span className="font-semibold text-slate-700">X-ray / images on file:</span> {files.some(f => f.type === "xray" || f.type === "photo") ? "Yes" : "No"}
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <TabsContent value="appointments" className="mt-8 space-y-4">
                            <p className="text-sm text-slate-500">Appointments from calendar. Data refreshes when you return to this tab.</p>
                            {appointments.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No appointments scheduled.
                                </div>
                            ) : (
                                appointments.map(apt => (
                                    <Card
                                        key={apt.id}
                                        className="shadow-sm border-none bg-white hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => { setRecordDetail("appointment"); setRecordData(apt) }}
                                    >
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">{format(new Date(apt.start_time), "PPP")} @ {format(new Date(apt.start_time), "p")}</div>
                                                    <CardTitle className="text-xl group-hover:text-teal-700 transition-colors">{apt.treatment_type}</CardTitle>
                                                    <CardDescription className="flex items-center mt-1">
                                                        <Clock className="h-3 w-3 mr-1" /> Assisted by Dr. {apt.dentists?.last_name || 'Staff'}
                                                    </CardDescription>
                                                    {(apt.checked_in_at || apt.checked_out_at) && (
                                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                                            {apt.checked_in_at && (
                                                                <span className="font-medium text-emerald-600">Checked in {format(new Date(apt.checked_in_at), "h:mm a")}</span>
                                                            )}
                                                            {apt.checked_out_at && (
                                                                <span className="font-medium text-slate-600">Checked out {format(new Date(apt.checked_out_at), "h:mm a")}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={apt.status === "completed"
                                                        ? "border-slate-200 bg-slate-50 text-slate-600"
                                                        : apt.status === "checked_in" || apt.status === "in_treatment"
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : apt.status === "no_show" || apt.status === "cancelled"
                                                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                                                : "border-slate-200"
                                                    }
                                                >
                                                    {getAppointmentStatusLabel(apt.status)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="mt-8 space-y-4">
                            {treatments.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No treatment history recorded.
                                </div>
                            ) : (
                                treatments.map(tx => (
                                    <Card
                                        key={tx.id}
                                        className="shadow-sm border-none bg-white cursor-pointer hover:bg-slate-50/50"
                                        onClick={() => { setRecordDetail("treatment"); setRecordData(tx) }}
                                    >
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{format(new Date(tx.created_at), "PPP")}</div>
                                                    <CardTitle className="text-xl text-slate-800">{tx.procedures_performed}</CardTitle>
                                                    <CardDescription className="font-semibold text-teal-600">{tx.diagnosis}</CardDescription>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={e => { e.stopPropagation(); handleDeleteTreatment(tx.id) }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                                "{tx.notes}"
                                            </div>
                                            {tx.dentists && (
                                                <div className="mt-4 flex items-center text-xs text-slate-500 font-medium">
                                                    <Users className="h-3 w-3 mr-1.5" />
                                                    Recorded by Dr. {tx.dentists.last_name}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="plans" className="mt-8 space-y-4 min-w-0">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <p className="text-sm text-slate-500">Treatment proposals with status: Draft, Presented, Accepted, Partially Accepted, or Declined.</p>
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { setTreatmentDialogTab("plan"); setIsTreatmentOpen(true) }}>
                                    <Plus className="h-4 w-4 mr-2" /> New plan
                                </Button>
                            </div>
                            {plansLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                </div>
                            ) : treatmentPlans.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No treatment plans for this patient.
                                </div>
                            ) : (
                                treatmentPlans.map((plan) => (
                                    <Card key={plan.id} className="shadow-sm border-none bg-white overflow-hidden">
                                        <CardHeader>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                                                    <CardDescription>
                                                        Total: ${Number(plan.total_estimated_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        {plan.dentist_name && ` · Dr. ${plan.dentist_name}`}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Select
                                                        value={plan.status || "draft"}
                                                        onValueChange={(val) => handlePlanStatusChange(plan.id, val)}
                                                        disabled={!!updatingPlanId}
                                                    >
                                                        <SelectTrigger className="w-[160px] h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="draft">Draft</SelectItem>
                                                            <SelectItem value="presented">Presented</SelectItem>
                                                            <SelectItem value="accepted">Accepted</SelectItem>
                                                            <SelectItem value="partially_accepted">Partially Accepted</SelectItem>
                                                            <SelectItem value="declined">Declined</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {plan.status === "draft" && (
                                                        <Button size="sm" variant="outline" onClick={() => handlePlanStatusChange(plan.id, "presented")} disabled={!!updatingPlanId}>
                                                            Present
                                                        </Button>
                                                    )}
                                                    {(plan.status === "presented" || plan.status === "draft") && (
                                                        <>
                                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAcceptAllItems(plan)} disabled={!!updatingPlanId}>
                                                                Accept All
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleDeclineAllItems(plan)} disabled={!!updatingPlanId}>
                                                                Decline All
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-2">
                                                {(plan.items || []).map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-slate-900 truncate">{item.description}</p>
                                                            <p className="text-xs text-slate-500">${Number(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                        <Select
                                                            value={item.acceptance_status || "pending"}
                                                            onValueChange={(val) => handleItemAcceptanceChange(item.id, val)}
                                                            disabled={!!updatingItemId}
                                                        >
                                                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="accepted">Accepted</SelectItem>
                                                                <SelectItem value="declined">Declined</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="files" className="mt-8 min-w-0 overflow-x-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0">
                                <Dialog open={isFileOpen} onOpenChange={setIsFileOpen}>
                                    <DialogTrigger asChild>
                                        <div className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-teal-50 hover:border-teal-200 cursor-pointer transition-all flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 aspect-square text-center">
                                            <div className="bg-slate-50 group-hover:bg-teal-100 p-4 rounded-full transition-colors mb-3">
                                                <Plus className="h-8 w-8" />
                                            </div>
                                            <span className="text-sm font-bold font-outfit">Upload New File</span>
                                            <span className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">X-ray / Photo</span>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleFileUpload}>
                                            <DialogHeader>
                                                <DialogTitle>Upload Patient File</DialogTitle>
                                                <DialogDescription>Add X-rays, clinical photos, or legal documents. Max size {MAX_FILE_SIZE_MB}MB.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-6 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Record Type</Label>
                                                    <Select value={fileData.type} onValueChange={val => setFileData({ ...fileData, type: val })}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="xray">Digital X-Ray</SelectItem>
                                                            <SelectItem value="photo">Clinical Photo</SelectItem>
                                                            <SelectItem value="document">Documentation</SelectItem>
                                                            <SelectItem value="chart">Patient Chart</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="display-name">Display Name</Label>
                                                    <Input
                                                        id="display-name"
                                                        placeholder="Ex: Upper Right Molar X-Ray"
                                                        value={fileData.name}
                                                        onChange={e => setFileData({ ...fileData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>File or take picture</Label>
                                                    {(fileData.type === "xray" || fileData.type === "photo") && (
                                                        <div className="space-y-2">
                                                            {!cameraStream ? (
                                                                <Button type="button" variant="outline" className="w-full" onClick={startCamera}>
                                                                    <ImageIcon className="mr-2 h-4 w-4" /> Take picture
                                                                </Button>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg border bg-black max-h-48 object-contain" />
                                                                    <div className="flex gap-2">
                                                                        <Button type="button" variant="outline" className="flex-1" onClick={capturePhoto}>Capture</Button>
                                                                        <Button type="button" variant="ghost" className="flex-1" onClick={stopCamera}>Cancel</Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-center w-full">
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-teal-300 transition-all">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <FileText className="w-8 h-8 mb-2 text-slate-400" />
                                                                <p className="text-sm text-slate-500 font-medium">
                                                                    {fileData.file ? fileData.file.name : "Click to select or drag & drop"}
                                                                </p>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept={fileData.type === "xray" || fileData.type === "photo" ? "image/*" : undefined}
                                                                onChange={e => setFileData({ ...fileData, file: e.target.files?.[0] || null })}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={isUploading} className="bg-teal-600 w-full lg:w-auto">
                                                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Start Secure Upload
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {files.map(file => (
                                    <Card key={file.id} className="relative group overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-md transition-all cursor-pointer aspect-square bg-white flex flex-col items-center justify-center p-4">
                                        <div className="bg-slate-50 group-hover:bg-teal-50 p-5 rounded-2xl mb-3 transition-colors">
                                            {file.type === 'xray' || file.type === 'photo' ? (
                                                <ImageIcon className="h-10 w-10 text-slate-400 group-hover:text-teal-600" />
                                            ) : (
                                                <FileIcon className="h-10 w-10 text-slate-400 group-hover:text-teal-600" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 px-2">{file.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">{file.type}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openFileUrl(file.file_path)}
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-teal-600/10 flex items-center justify-center transition-opacity cursor-pointer"
                                        >
                                            <div className="bg-white px-4 py-2 rounded-full text-xs font-bold text-teal-700 shadow-xl border border-teal-100 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <FileText className="h-3.5 w-3.5" /> View Record
                                            </div>
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="invoices" className="mt-8 space-y-4">
                            <p className="text-sm text-slate-500">All invoices for this patient. Open an invoice to view or print.</p>
                            {patientInvoices.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No invoices yet.
                                </div>
                            ) : (
                                patientInvoices.map(inv => (
                                    <Card key={inv.id} className="shadow-sm border-none bg-white hover:bg-slate-50/50 transition-colors">
                                        <CardHeader className="flex flex-row items-center justify-between py-4">
                                            <div>
                                                <CardTitle className="text-lg">{inv.invoice_number}</CardTitle>
                                                <CardDescription>
                                                    ${Number(inv.total_amount).toFixed(2)} · {format(new Date(inv.created_at), "PPP")}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="shrink-0">{inv.status}</Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(`/invoices?id=${inv.id}`, "_blank")}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
