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
    ExternalLink,
    Camera,
    Upload,
    DollarSign,
    FileBarChart,
    Shield,
    Pill
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
import { ProfilePictureUpload } from "@/components/patients/profile-picture-upload"
import { AIInsightsCards } from "@/components/patients/ai-insights-cards"
import { MedicalImageGallery } from "@/components/patients/medical-image-gallery"
import { InteractiveDentalChart } from "@/components/dental-chart/interactive-dental-chart"

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
        profile_picture_url?: string | null;
        created_at?: string;
    }
    appointments: {
        id: string;
        start_time: string;
        treatment_type: string;
        status: string;
        checked_in_at?: string | null;
        checked_out_at?: string | null;
        dentists?: { first_name: string; last_name: string; profile_picture_url?: string | null } | null;
    }[]
    treatments: {
        id: string;
        created_at: string;
        procedures_performed: string;
        diagnosis: string;
        notes: string;
        dentist_id?: string;
        dentists?: { first_name: string; last_name: string; profile_picture_url?: string | null } | null;
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
        profile_picture_url?: string | null;
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
    const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false)
    const [medicalImageTab, setMedicalImageTab] = useState<"xray" | "intraoral" | "3d_scan" | "add">("xray")

    // Calculate patient age and last visit
    const patientAge = patient.date_of_birth 
        ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
        : null
    
    const lastVisit = appointments.find(a => a.status === 'completed')
    const lastVisitDate = lastVisit ? format(new Date(lastVisit.start_time), "MMM d, yyyy") : "Never"
    
    // Calculate missed appointments for AI insights
    const missedAppointments = appointments.filter(a => a.status === 'no_show').length

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

    const handleDeleteFile = async (fileId: string) => {
        try {
            const res = await fetch(`/api/patients/${patient.id}/files/${fileId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast.success("File deleted")
                router.refresh()
            } else {
                toast.error("Failed to delete file")
            }
        } catch {
            toast.error("Error deleting file")
        }
    }

    const downloadFile = async (fileId: string, fileName: string) => {
        try {
            const file = files.find(f => f.id === fileId)
            if (!file) return
            const res = await fetch(`/api/patients/${patient.id}/file-url?path=${encodeURIComponent(file.file_path)}`)
            if (!res.ok) throw new Error("Failed to get file URL")
            const { url } = await res.json()
            if (url) {
                const link = document.createElement("a")
                link.href = url
                link.download = fileName
                link.target = "_blank"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        } catch {
            toast.error("Failed to download file")
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Profile Header with Background */}
            <div className="relative w-full h-48 sm:h-64 bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600">
                {/* Large Profile Picture */}
                <div className="absolute bottom-0 left-4 sm:left-8 transform translate-y-1/2">
                    <div className="relative">
                        <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-lg">
                            <AvatarImage src={patient.profile_picture_url || undefined} />
                            <AvatarFallback className="text-3xl sm:text-4xl bg-teal-100 text-teal-700">
                                {patient.first_name[0]}{patient.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            onClick={() => setProfilePictureDialogOpen(true)}
                            className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white hover:bg-slate-50 text-teal-600 shadow-lg"
                        >
                            <Camera className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Patient Name and ID */}
                <div className="absolute top-4 sm:top-6 left-4 sm:left-8 text-white">
                    <h1 className="text-2xl sm:text-3xl font-bold">{patient.first_name} {patient.last_name}</h1>
                    <p className="text-sm sm:text-base opacity-90">ID: PT-2024-{patient.id.slice(0, 3)}</p>
                </div>

                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/patients")}
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Patient Info Bar */}
            <div className="mt-20 sm:mt-24 px-4 sm:px-8 py-4 bg-white border-b border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    {patientAge && (
                        <div>
                            <p className="text-slate-500 font-medium mb-1">Age:</p>
                            <p className="text-slate-900 font-semibold">{patientAge}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Phone:</p>
                        <p className="text-slate-900 font-semibold">{patient.phone || "N/A"}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-slate-500 font-medium mb-1">Email:</p>
                        <p className="text-slate-900 font-semibold truncate">{patient.email || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Last Visit:</p>
                        <p className="text-slate-900 font-semibold">{lastVisitDate}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* AI Insights Cards */}
                <AIInsightsCards
                    missedAppointments={missedAppointments}
                    totalAppointments={appointments.length}
                    paymentHistory="excellent"
                    preventiveCareStatus="due"
                />

                {/* Medical Images Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medical Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={medicalImageTab} onValueChange={(v) => setMedicalImageTab(v as any)}>
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="xray" className="text-xs sm:text-sm">
                                    <ImageIcon className="h-4 w-4 mr-1" />
                                    X-Ray
                                </TabsTrigger>
                                <TabsTrigger value="intraoral" className="text-xs sm:text-sm">
                                    <Camera className="h-4 w-4 mr-1" />
                                    Intraoral
                                </TabsTrigger>
                                <TabsTrigger value="3d_scan" className="text-xs sm:text-sm">
                                    <Activity className="h-4 w-4 mr-1" />
                                    3D Scan
                                </TabsTrigger>
                                <TabsTrigger value="add" className="text-xs sm:text-sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="xray">
                                <MedicalImageGallery
                                    images={files.filter(f => f.type === 'xray')}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                />
                            </TabsContent>

                            <TabsContent value="intraoral">
                                <MedicalImageGallery
                                    images={files.filter(f => f.type === 'intraoral')}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                />
                            </TabsContent>

                            <TabsContent value="3d_scan">
                                <MedicalImageGallery
                                    images={files.filter(f => f.type === '3d_scan')}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                />
                            </TabsContent>

                            <TabsContent value="add">
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8">
                                    <div className="text-center space-y-4">
                                        <ImageIcon className="h-12 w-12 text-slate-400 mx-auto" />
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-1">Upload Medical Images</h3>
                                            <p className="text-sm text-slate-500">Select the type and upload images</p>
                                        </div>
                                        <Button onClick={() => setIsFileOpen(true)}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Choose Files
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Dental Chart Section */}
                <InteractiveDentalChart patientId={patient.id} />

                {/* Medical History & Insurance Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Medical History */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle>Medical History</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-teal-600"
                                onClick={() => setIsAlertsOpen(true)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-red-900">Allergies</p>
                                        <p className="text-sm text-red-700 mt-1">{patient.allergies || 'None'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Pill className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-blue-900">Medications</p>
                                        <p className="text-sm text-blue-700 mt-1">Lisinopril 10mg daily</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Activity className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-amber-900">Conditions</p>
                                        <p className="text-sm text-amber-700 mt-1">{patient.medical_conditions || 'None'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Information */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle>Insurance Information</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-teal-600"
                                onClick={() => setIsInsuranceOpen(true)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">{patient.insurance_provider || 'No Insurance'}</p>
                                    <p className="text-sm text-slate-500">Policy: {patient.insurance_policy_number || 'N/A'}</p>
                                </div>
                            </div>

                            {patient.insurance_provider && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500">Coverage:</p>
                                            <p className="font-semibold text-sm">80%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Annual Max:</p>
                                            <p className="font-semibold text-sm">$1,500</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Used:</p>
                                            <p className="font-semibold text-sm">$320</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Remaining:</p>
                                            <p className="font-semibold text-sm text-emerald-600">$1,180</p>
                                        </div>
                                    </div>

                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                        Valid until Dec 31, 2026
                                    </Badge>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            <Button
                                onClick={() => setAppointmentDialogOpen(true)}
                                className="h-auto py-6 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Calendar className="h-6 w-6" />
                                <span className="text-sm font-medium">Schedule Appointment</span>
                            </Button>

                            <Button
                                onClick={() => {
                                    setTreatmentDialogTab("record")
                                    setIsTreatmentOpen(true)
                                }}
                                variant="outline"
                                className="h-auto py-6 flex-col gap-2"
                            >
                                <FileText className="h-6 w-6" />
                                <span className="text-sm font-medium">Add Treatment Note</span>
                            </Button>

                            <Button
                                onClick={() => setIsFileOpen(true)}
                                variant="outline"
                                className="h-auto py-6 flex-col gap-2"
                            >
                                <Upload className="h-6 w-6" />
                                <span className="text-sm font-medium">Upload Images</span>
                            </Button>

                            <Button
                                onClick={() => router.push(`/messages?patientId=${patient.id}`)}
                                variant="outline"
                                className="h-auto py-6 flex-col gap-2"
                            >
                                <MessageSquare className="h-6 w-6" />
                                <span className="text-sm font-medium">Send Message</span>
                            </Button>

                            <Button
                                onClick={() => setInvoiceDialogOpen(true)}
                                variant="outline"
                                className="h-auto py-6 flex-col gap-2"
                            >
                                <DollarSign className="h-6 w-6" />
                                <span className="text-sm font-medium">View Billing</span>
                            </Button>

                            <Button
                                onClick={() => toast.info("Report generation coming soon")}
                                variant="outline"
                                className="h-auto py-6 flex-col gap-2"
                            >
                                <FileBarChart className="h-6 w-6" />
                                <span className="text-sm font-medium">Generate Report</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Treatment History with Dentist Photos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Treatment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {treatments.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p>No treatment history yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {treatments.map((treatment) => {
                                    const dentist = treatment.dentists
                                    return (
                                        <div key={treatment.id} className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <Avatar className="h-12 w-12 shrink-0">
                                                <AvatarImage src={dentist?.profile_picture_url || undefined} />
                                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                                    {dentist ? `${dentist.first_name[0]}${dentist.last_name[0]}` : 'Dr'}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-slate-900">{treatment.procedures_performed}</h4>
                                                        <p className="text-sm text-slate-500">
                                                            Dr. {dentist?.first_name || ''} {dentist?.last_name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-slate-400 shrink-0">
                                                        {format(new Date(treatment.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                {treatment.notes && (
                                                    <p className="text-sm text-slate-600 leading-relaxed">{treatment.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Profile Picture Upload Dialog */}
            <ProfilePictureUpload
                open={profilePictureDialogOpen}
                onOpenChange={setProfilePictureDialogOpen}
                currentImageUrl={patient.profile_picture_url}
                onUploadComplete={(url) => {
                    router.refresh()
                    toast.success("Profile picture updated")
                }}
                uploadEndpoint={`/api/patients/${patient.id}/profile-picture`}
                title="Update Patient Photo"
                description="Upload or take a photo of the patient"
            />

            {/* Hidden Dialogs Section */}
            <div className="hidden">
                <NewAppointmentDialog
                    patients={[{ id: patient.id, first_name: patient.first_name, last_name: patient.last_name }]}
                    dentists={dentists.map(d => ({ id: d.id, first_name: d.first_name, last_name: d.last_name }))}
                    defaultPatientId={patient.id}
                    open={appointmentDialogOpen}
                    onOpenChange={setAppointmentDialogOpen}
                />
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
                    trigger={<div />}
                />
            </div>

            {/* Contact Info Update Dialog */}
            <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
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

            {/* Medical Alerts Update Dialog */}
            <Dialog open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
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

            {/* Insurance Update Dialog */}
            <Dialog open={isInsuranceOpen} onOpenChange={setIsInsuranceOpen}>
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

            {/* Treatment Dialog */}
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
                                                        <span>{item.description} &times; {item.quantity} &mdash; ${item.total_price.toFixed(2)}</span>
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
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                                                <SelectTrigger><SelectValue placeholder="Reference" /></SelectTrigger>
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

            {/* File Upload Dialog */}
            <Dialog open={isFileOpen} onOpenChange={setIsFileOpen}>
                <DialogContent>
                    <form onSubmit={handleFileUpload}>
                        <DialogHeader>
                            <DialogTitle>Upload Patient File</DialogTitle>
                            <DialogDescription>Add X-rays, clinical photos, or documents. Max size {MAX_FILE_SIZE_MB}MB.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label>Record Type</Label>
                                <Select value={fileData.type} onValueChange={val => setFileData({ ...fileData, type: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="xray">X-Ray</SelectItem>
                                        <SelectItem value="intraoral">Intraoral Photo</SelectItem>
                                        <SelectItem value="3d_scan">3D Scan</SelectItem>
                                        <SelectItem value="document">Documentation</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
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
                                {(fileData.type === "xray" || fileData.type === "intraoral" || fileData.type === "3d_scan") && (
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
                                            accept={fileData.type !== "document" ? "image/*" : undefined}
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

            {/* Invoice Created Dialog */}
            <Dialog open={!!createdInvoice} onOpenChange={(open) => !open && setCreatedInvoice(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invoice created</DialogTitle>
                        <DialogDescription>
                            {createdInvoice && (
                                <>Invoice {createdInvoice.invoice_number} &mdash; ${Number(createdInvoice.total_amount).toFixed(2)}</>
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
                                    if (createdInvoice) navigator.clipboard.writeText(createdInvoice.invoice_number)
                                    toast.success("Invoice number copied!")
                                }}
                            >
                                <Share2 className="mr-2 h-4 w-4" /> Copy invoice #
                            </Button>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setCreatedInvoice(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
