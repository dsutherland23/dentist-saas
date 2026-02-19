"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { DentalChartV2Container } from "@/components/dental-chart-v2/DentalChartV2Container"

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
    const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null)
    const [medicalImageTab, setMedicalImageTab] = useState<"xray" | "intraoral" | "3d_scan" | "add">("xray")

    // Resolve profile picture to a signed URL when it's in private storage (patient-files)
    useEffect(() => {
        const raw = patient.profile_picture_url
        if (!raw?.trim()) {
            setAvatarImageUrl(null)
            return
        }
        const match = raw.match(/\/patient-files\/(.+)$/)
        if (match) {
            const path = decodeURIComponent(match[1])
            fetch(`/api/patients/${patient.id}/file-url?path=${encodeURIComponent(path)}`)
                .then((res) => res.ok ? res.json() : null)
                .then((data: { url?: string } | null) => data?.url ?? null)
                .then(setAvatarImageUrl)
                .catch(() => setAvatarImageUrl(null))
        } else {
            setAvatarImageUrl(raw)
        }
    }, [patient.id, patient.profile_picture_url])
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [reportSections, setReportSections] = useState({ summary: true, treatments: true, appointments: true, billing: true })
    const [reportFormat, setReportFormat] = useState<"csv" | "text">("csv")

    // Calculate patient age and last visit
    const patientAge = patient.date_of_birth
        ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
        : null

    const lastVisit = appointments.find(a => a.status === "completed")
    const lastVisitDate = lastVisit ? format(new Date(lastVisit.start_time), "MMM d, yyyy") : "Never"

    // Derive payment history for AI insights from invoices
    const paidCount = patientInvoices.filter((inv) => inv.status === "paid").length
    const overdueCount = patientInvoices.filter((inv) => inv.status === "overdue").length
    const paymentHistoryDerived: "excellent" | "good" | "poor" =
        patientInvoices.length === 0 ? "good" : overdueCount > 0 ? "poor" : paidCount === patientInvoices.length ? "excellent" : "good"

    // Derive preventive care status from last completed visit (e.g. > 6 months = due/overdue)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const lastVisitDateObj = lastVisit ? new Date(lastVisit.start_time) : null
    const preventiveCareStatusDerived: "due" | "current" | "overdue" =
        !lastVisitDateObj ? "due" : lastVisitDateObj < sixMonthsAgo ? "overdue" : "current"

    // Calculate missed appointments for AI insights
    const missedAppointments = appointments.filter((a) => a.status === "no_show").length

    // Appointments: upcoming (scheduled/confirmed) and recent past (completed) for display
    const now = new Date()
    const upcomingAppointments = appointments
        .filter((a) => ["scheduled", "confirmed", "checked_in", "in_treatment"].includes(a.status) && new Date(a.start_time) >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    const recentPastAppointments = appointments
        .filter((a) => a.status === "completed")
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 5)

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
            toast.error("Please select a file or capture a photo first")
            return
        }
        if (fileData.file.size === 0) {
            toast.error("File is empty. Try capturing the photo again or choose a different file.")
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

    const startCamera = async () => {
        try {
            const videoConstraints: MediaTrackConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }
            let stream: MediaStream | null = null
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { ...videoConstraints, facingMode: "environment" },
                })
            } catch {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { ...videoConstraints, facingMode: "user" },
                    })
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
                }
            }
            setCameraStream(stream)
        } catch (err) {
            console.error("Camera error:", err)
            toast.error("Camera access denied or unavailable. Use a device with a camera or upload a file instead.")
        }
    }

    useEffect(() => {
        if (!cameraStream || !videoRef.current) return
        videoRef.current.srcObject = cameraStream
        return () => {
            if (videoRef.current) videoRef.current.srcObject = null
        }
    }, [cameraStream])

    const stopCamera = () => {
        cameraStream?.getTracks().forEach((t) => t.stop())
        setCameraStream(null)
        if (videoRef.current) videoRef.current.srcObject = null
    }

    const capturePhoto = () => {
        if (!videoRef.current || !cameraStream) return
        const video = videoRef.current
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            toast.error("Video not ready. Wait a moment and try again.")
            return
        }
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext("2d")?.drawImage(video, 0, 0)
        canvas.toBlob(
            (blob) => {
                if (!blob || blob.size === 0) {
                    toast.error("Capture failed. Try again.")
                    return
                }
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
                setFileData((prev) => ({ ...prev, file, type: prev.type === "xray" ? "xray" : prev.type === "intraoral" ? "intraoral" : prev.type === "3d_scan" ? "3d_scan" : "photo" }))
                stopCamera()
                toast.success("Photo captured. Click Start Secure Upload to save.")
            },
            "image/jpeg",
            0.9
        )
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

    const getImageUrl = useCallback(
        async (filePath: string): Promise<string> => {
            const res = await fetch(`/api/patients/${patient.id}/file-url?path=${encodeURIComponent(filePath)}`)
            if (!res.ok) throw new Error("Failed to get image URL")
            const { url } = await res.json()
            if (!url) throw new Error("No URL returned")
            return url
        },
        [patient.id]
    )

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

    const handleGenerateReport = () => {
        const lines: string[] = []
        const name = `${patient.first_name} ${patient.last_name}`.replace(/,/g, " ")
        const filename = `patient-report-${name.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}`

        if (reportFormat === "csv") {
            if (reportSections.summary) {
                lines.push("Section,Field,Value")
                lines.push("Summary,Patient Name," + (patient.first_name + " " + patient.last_name))
                lines.push("Summary,Date of Birth," + (patient.date_of_birth || "—"))
                lines.push("Summary,Age," + (patientAge ?? "—"))
                lines.push("Summary,Phone," + (patient.phone || "—"))
                lines.push("Summary,Email," + (patient.email || "—"))
                lines.push("Summary,Address," + (patient.address || "—"))
                lines.push("Summary,Last Visit," + lastVisitDate)
                lines.push("Summary,Insurance," + (patient.insurance_provider || "—"))
                lines.push("Summary,Policy," + (patient.insurance_policy_number || "—"))
                lines.push("Summary,Allergies," + (patient.allergies || "None"))
                lines.push("Summary,Medical Conditions," + (patient.medical_conditions || "None"))
                lines.push("")
            }
            if (reportSections.appointments && appointments.length > 0) {
                lines.push("Appointments,Date,Time,Treatment,Status,Dentist")
                appointments.slice(0, 50).forEach((a) => {
                    const dt = new Date(a.start_time)
                    lines.push(`Appointments,${format(dt, "yyyy-MM-dd")},${format(dt, "HH:mm")},${(a.treatment_type || "—").replace(/,/g, ";")},${a.status},${a.dentists ? `Dr. ${a.dentists.first_name} ${a.dentists.last_name}` : "—"}`)
                })
                lines.push("")
            }
            if (reportSections.treatments && treatments.length > 0) {
                lines.push("Treatments,Date,Procedure,Diagnosis,Notes,Dentist")
                treatments.slice(0, 50).forEach((t) => {
                    const d = t.dentists ? `Dr. ${t.dentists.first_name} ${t.dentists.last_name}` : "—"
                    lines.push(`Treatments,${format(new Date(t.created_at), "yyyy-MM-dd")},${(t.procedures_performed || "").replace(/,/g, ";")},${(t.diagnosis || "").replace(/,/g, ";")},${(t.notes || "").replace(/,/g, ";")},${d}`)
                })
                lines.push("")
            }
            if (reportSections.billing && patientInvoices.length > 0) {
                lines.push("Billing,Invoice Number,Amount,Status,Date")
                patientInvoices.forEach((inv) => {
                    lines.push(`Billing,${inv.invoice_number},${Number(inv.total_amount).toFixed(2)},${inv.status},${format(new Date(inv.created_at), "yyyy-MM-dd")}`)
                })
            }
        } else {
            if (reportSections.summary) {
                lines.push("PATIENT SUMMARY")
                lines.push("Name: " + patient.first_name + " " + patient.last_name)
                lines.push("DOB: " + (patient.date_of_birth || "—") + "  Age: " + (patientAge ?? "—"))
                lines.push("Phone: " + (patient.phone || "—"))
                lines.push("Email: " + (patient.email || "—"))
                lines.push("Address: " + (patient.address || "—"))
                lines.push("Last Visit: " + lastVisitDate)
                lines.push("Insurance: " + (patient.insurance_provider || "—") + "  Policy: " + (patient.insurance_policy_number || "—"))
                lines.push("Allergies: " + (patient.allergies || "None"))
                lines.push("Conditions: " + (patient.medical_conditions || "None"))
                lines.push("")
            }
            if (reportSections.appointments && appointments.length > 0) {
                lines.push("APPOINTMENTS")
                appointments.slice(0, 50).forEach((a) => {
                    const dt = new Date(a.start_time)
                    lines.push(`  ${format(dt, "yyyy-MM-dd HH:mm")}  ${a.treatment_type || "—"}  ${a.status}  ${a.dentists ? `Dr. ${a.dentists.first_name} ${a.dentists.last_name}` : ""}`)
                })
                lines.push("")
            }
            if (reportSections.treatments && treatments.length > 0) {
                lines.push("TREATMENT HISTORY")
                treatments.slice(0, 50).forEach((t) => {
                    lines.push(`  ${format(new Date(t.created_at), "yyyy-MM-dd")}  ${t.procedures_performed || "—"}`)
                    if (t.notes) lines.push("    Notes: " + t.notes)
                })
                lines.push("")
            }
            if (reportSections.billing && patientInvoices.length > 0) {
                lines.push("BILLING")
                patientInvoices.forEach((inv) => {
                    lines.push(`  ${inv.invoice_number}  $${Number(inv.total_amount).toFixed(2)}  ${inv.status}  ${format(new Date(inv.created_at), "yyyy-MM-dd")}`)
                })
            }
        }

        const content = lines.join(reportFormat === "csv" ? "\n" : "\n")
        const blob = new Blob([content], { type: reportFormat === "csv" ? "text/csv" : "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}.${reportFormat === "csv" ? "csv" : "txt"}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setReportDialogOpen(false)
        toast.success("Report downloaded")
    }

    return (
        <div className="bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border max-w-[100vw]">
            {/* Profile Header with Background */}
            <div className="relative w-full h-48 sm:h-64 bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600">
                {/* Large Profile Picture */}
                <div className="absolute bottom-0 left-4 sm:left-8 transform translate-y-1/2">
                    <div className="relative">
                        <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-lg">
                            <AvatarImage src={avatarImageUrl || undefined} alt="" />
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
            <div className="mt-20 sm:mt-24 px-4 sm:px-6 md:px-8 py-4 bg-white border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 text-sm min-w-0">
                        {patientAge !== null && (
                            <div className="min-w-0">
                                <p className="text-slate-500 font-medium mb-1">Age</p>
                                <p className="text-slate-900 font-semibold truncate">{patientAge}</p>
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-slate-500 font-medium mb-1">Phone</p>
                            <p className="text-slate-900 font-semibold truncate" title={patient.phone || undefined}>{patient.phone || "—"}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1 min-w-0">
                            <p className="text-slate-500 font-medium mb-1">Email</p>
                            <p className="text-slate-900 font-semibold truncate" title={patient.email || undefined}>{patient.email || "—"}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-500 font-medium mb-1">Last Visit</p>
                            <p className="text-slate-900 font-semibold">{lastVisitDate}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 w-full sm:w-auto"
                        onClick={() => setIsContactOpen(true)}
                        aria-label="Edit contact information"
                    >
                        <Pencil className="h-4 w-4 mr-2 sm:mr-2" />
                        Edit contact
                    </Button>
                </div>
            </div>

            {/* Main Content — responsive padding and max-width for xl */}
            <div className="p-4 sm:p-6 lg:p-8 xl:max-w-[1600px] xl:mx-auto space-y-4 sm:space-y-6">
                {/* AI Insights Cards */}
                <AIInsightsCards
                    missedAppointments={missedAppointments}
                    totalAppointments={appointments.length}
                    paymentHistory={paymentHistoryDerived}
                    preventiveCareStatus={preventiveCareStatusDerived}
                />

                {/* Appointments: Upcoming & Recent */}
                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg">Appointments</CardTitle>
                        <Button
                            size="sm"
                            onClick={() => setAppointmentDialogOpen(true)}
                            className="bg-teal-600 hover:bg-teal-700"
                            aria-label="Schedule new appointment"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Schedule
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingAppointments.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Upcoming</h4>
                                <ul className="space-y-2">
                                    {upcomingAppointments.slice(0, 5).map((apt) => (
                                        <li
                                            key={apt.id}
                                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-teal-100 text-teal-700 shrink-0">
                                                    <span className="text-xs font-medium">{format(new Date(apt.start_time), "MMM")}</span>
                                                    <span className="text-lg font-bold leading-tight">{format(new Date(apt.start_time), "d")}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">{apt.treatment_type || "Appointment"}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {apt.dentists ? `Dr. ${apt.dentists.first_name} ${apt.dentists.last_name}` : "—"} · {format(new Date(apt.start_time), "h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="shrink-0 capitalize">{getAppointmentStatusLabel(apt.status)}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {recentPastAppointments.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent</h4>
                                <ul className="space-y-2">
                                    {recentPastAppointments.map((apt) => (
                                        <li
                                            key={apt.id}
                                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">{apt.treatment_type || "Visit"}</p>
                                                    <p className="text-sm text-slate-500">{format(new Date(apt.start_time), "MMM d, yyyy")}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {upcomingAppointments.length === 0 && recentPastAppointments.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No appointments yet</p>
                                <p className="text-sm mt-1">Schedule one to get started.</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => setAppointmentDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Schedule appointment
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Medical Images Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medical Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={medicalImageTab} onValueChange={(v) => setMedicalImageTab(v as typeof medicalImageTab)}>
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 gap-1">
                                <TabsTrigger value="xray" className="text-xs sm:text-sm truncate">
                                    <ImageIcon className="h-4 w-4 mr-1 shrink-0" />
                                    X-Ray
                                </TabsTrigger>
                                <TabsTrigger value="intraoral" className="text-xs sm:text-sm truncate">
                                    <Camera className="h-4 w-4 mr-1 shrink-0" />
                                    Intraoral
                                </TabsTrigger>
                                <TabsTrigger value="3d_scan" className="text-xs sm:text-sm truncate">
                                    <Activity className="h-4 w-4 mr-1 shrink-0" />
                                    3D Scan
                                </TabsTrigger>
                                <TabsTrigger value="add" className="text-xs sm:text-sm truncate">
                                    <Plus className="h-4 w-4 mr-1 shrink-0" />
                                    Add
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="xray">
                                <MedicalImageGallery
                                    images={files.filter((f) => f.type === "xray")}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                    getImageUrl={getImageUrl}
                                />
                            </TabsContent>

                            <TabsContent value="intraoral">
                                <MedicalImageGallery
                                    images={files.filter((f) => f.type === "intraoral")}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                    getImageUrl={getImageUrl}
                                />
                            </TabsContent>

                            <TabsContent value="3d_scan">
                                <MedicalImageGallery
                                    images={files.filter((f) => f.type === "3d_scan")}
                                    onDelete={handleDeleteFile}
                                    onDownload={downloadFile}
                                    getImageUrl={getImageUrl}
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
                <DentalChartV2Container patientId={patient.id} />

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
                                        <p className="text-sm text-blue-700 mt-1 break-words">Not recorded — add in medical conditions if needed</p>
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
                                    <p className="font-semibold text-slate-900 break-words">{patient.insurance_provider || "No insurance on file"}</p>
                                    <p className="text-sm text-slate-500">Policy: {patient.insurance_policy_number || "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Treatment Plans */}
                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg">Treatment Plans</CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setTreatmentDialogTab("plan")
                                setIsTreatmentOpen(true)
                            }}
                            aria-label="Create treatment plan"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New plan
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {plansLoading ? (
                            <div className="flex items-center justify-center py-8 text-slate-500">
                                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                                Loading plans…
                            </div>
                        ) : treatmentPlans.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No treatment plans</p>
                                <p className="text-sm mt-1">Create a plan to propose treatments to the patient.</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setTreatmentDialogTab("plan"); setIsTreatmentOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-2" /> Create plan
                                </Button>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {treatmentPlans.map((plan: { id: string; plan_name: string; status: string; items?: { id: string; description: string; total_price: number; acceptance_status: string }[] }) => (
                                    <li key={plan.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{plan.plan_name || "Unnamed plan"}</p>
                                                <p className="text-sm text-slate-500">{(plan.items || []).length} item(s)</p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0 capitalize">{plan.status}</Badge>
                                        </div>
                                        {(plan.items || []).length > 0 && (
                                            <ul className="space-y-1 text-sm text-slate-600">
                                                {(plan.items as { id: string; description: string; total_price: number; acceptance_status: string }[]).slice(0, 3).map((item: { id: string; description: string; total_price: number; acceptance_status: string }) => (
                                                    <li key={item.id} className="flex justify-between gap-2 truncate">
                                                        <span className="truncate">{item.description}</span>
                                                        <span className="shrink-0">${Number(item.total_price).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                                {(plan.items || []).length > 3 && (
                                                    <li className="text-slate-500">+{(plan.items || []).length - 3} more</li>
                                                )}
                                            </ul>
                                        )}
                                        {plan.status === "draft" && (
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-teal-600 hover:bg-teal-700"
                                                    disabled={updatingPlanId === plan.id}
                                                    onClick={() => handleAcceptAllItems(plan)}
                                                >
                                                    {updatingPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    Accept all
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={updatingPlanId === plan.id}
                                                    onClick={() => handleDeclineAllItems(plan)}
                                                >
                                                    Decline all
                                                </Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Button
                                onClick={() => setAppointmentDialogOpen(true)}
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="Schedule appointment"
                            >
                                <Calendar className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">Schedule Appointment</span>
                            </Button>

                            <Button
                                onClick={() => {
                                    setTreatmentDialogTab("record")
                                    setIsTreatmentOpen(true)
                                }}
                                variant="outline"
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="Add treatment note"
                            >
                                <FileText className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">Add Treatment Note</span>
                            </Button>

                            <Button
                                onClick={() => setIsFileOpen(true)}
                                variant="outline"
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="Upload images"
                            >
                                <Upload className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">Upload Images</span>
                            </Button>

                            <Button
                                onClick={() => router.push(`/messages?patientId=${patient.id}`)}
                                variant="outline"
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="Send message"
                            >
                                <MessageSquare className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">Send Message</span>
                            </Button>

                            <Button
                                onClick={() => setInvoiceDialogOpen(true)}
                                variant="outline"
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="View billing"
                            >
                                <DollarSign className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">View Billing</span>
                            </Button>

                            <Button
                                onClick={() => setReportDialogOpen(true)}
                                variant="outline"
                                className="h-auto min-h-[80px] py-4 sm:py-6 flex flex-col gap-2 min-w-0 overflow-hidden whitespace-normal"
                                aria-label="Generate report"
                            >
                                <FileBarChart className="h-6 w-6 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center leading-tight break-words line-clamp-2 min-w-0 w-full px-0.5">Generate Report</span>
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
                                        <div key={treatment.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <Avatar className="h-12 w-12 shrink-0">
                                                    <AvatarImage src={dentist?.profile_picture_url || undefined} />
                                                    <AvatarFallback className="bg-teal-100 text-teal-700">
                                                        {dentist ? `${dentist.first_name[0]}${dentist.last_name[0]}` : "Dr"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                                                        <h4 className="font-semibold text-slate-900 break-words">{treatment.procedures_performed}</h4>
                                                        <span className="text-sm text-slate-400 shrink-0">
                                                            {format(new Date(treatment.created_at), "MMM d, yyyy")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        Dr. {dentist?.first_name || ""} {dentist?.last_name || "Unknown"}
                                                    </p>
                                                </div>
                                            </div>
                                            {treatment.notes && (
                                                <p className="text-sm text-slate-600 leading-relaxed break-words pl-0 sm:pl-16">{treatment.notes}</p>
                                            )}
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
                    const match = url?.match(/\/patient-files\/(.+)$/)
                    if (match) {
                        const path = decodeURIComponent(match[1])
                        fetch(`/api/patients/${patient.id}/file-url?path=${encodeURIComponent(path)}`)
                            .then((res) => res.ok ? res.json() : null)
                            .then((data: { url?: string } | null) => data?.url && setAvatarImageUrl(data.url))
                    } else if (url) {
                        setAvatarImageUrl(url)
                    }
                    router.refresh()
                    toast.success("Profile picture updated")
                }}
                uploadEndpoint={`/api/patients/${patient.id}/profile-picture`}
                title="Update Patient Photo"
                description="Upload or take a photo of the patient"
            />

            {/* Quick Action dialogs — rendered in tree so open/onOpenChange work reliably */}
            <NewAppointmentDialog
                patients={[{ id: patient.id, first_name: patient.first_name, last_name: patient.last_name }]}
                dentists={dentists.map((d) => ({ id: d.id, first_name: d.first_name, last_name: d.last_name }))}
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
                        setPatientInvoices((prev) => [
                            {
                                id: inv.id,
                                invoice_number: inv.invoice_number,
                                total_amount: inv.total_amount,
                                status: "sent",
                                created_at: new Date().toISOString(),
                            },
                            ...prev,
                        ])
                    }
                    setInvoiceDialogOpen(false)
                }}
                trigger={<span className="sr-only">Create invoice</span>}
            />

            {/* Contact Info Update Dialog */}
            <Dialog
                open={isContactOpen}
                onOpenChange={(open) => {
                    if (open) setContactData({ phone: patient.phone || "", email: patient.email || "", address: patient.address || "" })
                    setIsContactOpen(open)
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-md">
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-md">
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-md">
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:max-w-lg">
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
                                            <Select value={treatmentData.dentist_id || undefined} onValueChange={val => setTreatmentData(prev => ({ ...prev, dentist_id: val }))}>
                                                <SelectTrigger><SelectValue placeholder="Select dentist" /></SelectTrigger>
                                                <SelectContent className="z-[100]" position="popper">
                                                    {dentists.length === 0 ? (
                                                        <div className="py-2 px-2 text-sm text-slate-500">No dentists available</div>
                                                    ) : (
                                                        dentists.map(dentist => (
                                                            <SelectItem key={dentist.id} value={dentist.id}>Dr. {dentist.last_name}</SelectItem>
                                                        ))
                                                    )}
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-lg">
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
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
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

            {/* Generate Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate Patient Report</DialogTitle>
                        <DialogDescription>
                            Choose sections to include and download as CSV or text for {patient.first_name} {patient.last_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Include sections</Label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={reportSections.summary}
                                        onCheckedChange={(c) => setReportSections((s) => ({ ...s, summary: !!c }))}
                                    />
                                    <span className="text-sm">Patient summary (demographics, contact, insurance)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={reportSections.appointments}
                                        onCheckedChange={(c) => setReportSections((s) => ({ ...s, appointments: !!c }))}
                                    />
                                    <span className="text-sm">Appointments</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={reportSections.treatments}
                                        onCheckedChange={(c) => setReportSections((s) => ({ ...s, treatments: !!c }))}
                                    />
                                    <span className="text-sm">Treatment history</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={reportSections.billing}
                                        onCheckedChange={(c) => setReportSections((s) => ({ ...s, billing: !!c }))}
                                    />
                                    <span className="text-sm">Billing / invoices</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Format</Label>
                            <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as "csv" | "text")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV (Excel-friendly)</SelectItem>
                                    <SelectItem value="text">Plain text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={handleGenerateReport}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
