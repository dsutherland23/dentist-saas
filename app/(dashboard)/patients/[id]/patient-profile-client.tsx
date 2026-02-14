"use client"

import React, { useState } from "react"
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
    Loader2
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
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"
import { NewInvoiceDialog } from "../../invoices/new-invoice-dialog"
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
    const supabase = createClient()
    const [isAlertsOpen, setIsAlertsOpen] = useState(false)
    const [isInsuranceOpen, setIsInsuranceOpen] = useState(false)
    const [isContactOpen, setIsContactOpen] = useState(false)
    const [isTreatmentOpen, setIsTreatmentOpen] = useState(false)
    const [isFileOpen, setIsFileOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

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
        procedures_performed: "",
        diagnosis: "",
        notes: "",
        dentist_id: currentUserId,
        appointment_id: ""
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
        setIsSaving(true)
        try {
            const res = await fetch(`/api/patients/${patient.id}/treatments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentData)
            })
            if (res.ok) {
                toast.success("Treatment record added")
                router.refresh()
            }
        } catch (error) {
            toast.error("Failed to add treatment record")
        } finally {
            setIsSaving(false)
            setIsTreatmentOpen(false)
        }
    }

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileData.file) {
            toast.error("Please select a file")
            return
        }

        setIsUploading(true)
        try {
            const fileExt = fileData.file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${patient.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('patient-files')
                .upload(filePath, fileData.file)

            if (uploadError) throw uploadError

            const res = await fetch(`/api/patients/${patient.id}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fileData.name || fileData.file.name,
                    type: fileData.type,
                    file_path: filePath
                })
            })

            if (res.ok) {
                toast.success("File uploaded successfully")
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload file")
        } finally {
            setIsUploading(false)
            setIsFileOpen(false)
        }
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

    const getFileUrl = (path: string) => {
        const { data } = supabase.storage.from('patient-files').getPublicUrl(path)
        return data.publicUrl
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
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
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => router.push(`/messages?patientId=${patient.id}`)}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <NewInvoiceDialog
                        defaultPatientId={patient.id}
                        trigger={
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" /> Invoice
                            </Button>
                        }
                    />
                    <Dialog open={isTreatmentOpen} onOpenChange={setIsTreatmentOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700 shadow-teal-100 shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> Add Treatment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleAddTreatment}>
                                <DialogHeader>
                                    <DialogTitle>Add Treatment Record</DialogTitle>
                                    <DialogDescription>Record a new procedure or diagnosis for this patient.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Procedures Performed</Label>
                                            {availableTreatments.length > 0 && (
                                                <Select onValueChange={(val) => {
                                                    const current = treatmentData.procedures_performed
                                                    const newValue = current ? `${current}, ${val}` : val
                                                    setTreatmentData({ ...treatmentData, procedures_performed: newValue })
                                                }}>
                                                    <SelectTrigger className="h-8 w-[180px] text-xs">
                                                        <SelectValue placeholder="Add Preset..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableTreatments.map(t => (
                                                            <SelectItem key={t.id} value={t.name}>
                                                                {t.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                        <Input
                                            placeholder="Ex: Teeth cleaning, Filling..."
                                            value={treatmentData.procedures_performed}
                                            onChange={e => setTreatmentData({ ...treatmentData, procedures_performed: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Diagnosis</Label>
                                        <Input
                                            placeholder="Ex: Slight gingivitis..."
                                            value={treatmentData.diagnosis}
                                            onChange={e => setTreatmentData({ ...treatmentData, diagnosis: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            placeholder="Additional clinical notes..."
                                            value={treatmentData.notes}
                                            onChange={e => setTreatmentData({ ...treatmentData, notes: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Dentist</Label>
                                            <Select value={treatmentData.dentist_id} onValueChange={val => setTreatmentData({ ...treatmentData, dentist_id: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Dentist" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dentists.map(dentist => (
                                                        <SelectItem key={dentist.id} value={dentist.id}>
                                                            Dr. {dentist.last_name} ({dentist.first_name})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Appointment (Optional)</Label>
                                            <Select onValueChange={val => setTreatmentData({ ...treatmentData, appointment_id: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Reference Appt." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {appointments.map(apt => (
                                                        <SelectItem key={apt.id} value={apt.id}>{format(new Date(apt.start_time), 'MMM d')}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving} className="bg-teal-600">
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Record
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

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

                    <Card className={`border-none shadow-sm ${!patient.insurance_provider ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
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
                            {!patient.insurance_provider ? (
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
                                    <div className="font-semibold text-slate-900">{patient.insurance_provider}</div>
                                    <div className="text-sm text-slate-500 italic">Policy #{patient.insurance_policy_number || "N/A"}</div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="appointments" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-8">
                            <TabsTrigger value="appointments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600">Appointments</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600">Treatment History</TabsTrigger>
                            <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 py-4 text-sm font-semibold text-slate-500 data-[state=active]:text-teal-600">Files & X-Rays</TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments" className="mt-8 space-y-4">
                            {appointments.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No appointments scheduled.
                                </div>
                            ) : (
                                appointments.map(apt => (
                                    <Card key={apt.id} className="shadow-sm border-none bg-white hover:bg-slate-50/50 transition-colors group">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">{format(new Date(apt.start_time), "PPP")} @ {format(new Date(apt.start_time), "p")}</div>
                                                    <CardTitle className="text-xl group-hover:text-teal-700 transition-colors">{apt.treatment_type}</CardTitle>
                                                    <CardDescription className="flex items-center mt-1">
                                                        <Clock className="h-3 w-3 mr-1" /> Assisted by Dr. {apt.dentists?.last_name || 'Staff'}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className="capitalize border-slate-200">{apt.status}</Badge>
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
                                    <Card key={tx.id} className="shadow-sm border-none bg-white">
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
                                                    onClick={() => handleDeleteTreatment(tx.id)}
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

                        <TabsContent value="files" className="mt-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                                                <DialogDescription>Add X-rays, clinical photos, or legal documents.</DialogDescription>
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
                                                    <Label>File Selection</Label>
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
                                        <a
                                            href={getFileUrl(file.file_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-teal-600/10 flex items-center justify-center transition-opacity"
                                        >
                                            <div className="bg-white px-4 py-2 rounded-full text-xs font-bold text-teal-700 shadow-xl border border-teal-100 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <FileText className="h-3.5 w-3.5" /> View Record
                                            </div>
                                        </a>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
