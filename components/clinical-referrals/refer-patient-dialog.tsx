"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Loader2, Copy, Mail, MessageCircle, Search, X } from "lucide-react"
import { toast } from "sonner"
import { buildReferralIntakeEmailContent, REFERRAL_INTAKE_EMAIL_SUBJECT, type ClinicBranding } from "@/lib/branding"

interface PatientOption {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string | null
}

interface Specialist {
    id: string
    name: string
    specialty: { name: string }
}

interface ReferPatientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialist: Specialist | null
    /** When set, after referral is sent we auto-open Email or WhatsApp with the intake link */
    preferredShareChannel?: "email" | "whatsapp" | null
    onSuccess?: () => void
    /** Clinic branding for message header/footer */
    clinic?: ClinicBranding | null
}

export function ReferPatientDialog({
    open,
    onOpenChange,
    specialist,
    preferredShareChannel,
    onSuccess,
    clinic,
}: ReferPatientDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [intakeLink, setIntakeLink] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState({
        patient_first_name: "",
        patient_last_name: "",
        dob: "",
        urgency: "routine",
        reason: "",
    })
    const [consentChecked, setConsentChecked] = React.useState(false)
    const [patients, setPatients] = React.useState<PatientOption[]>([])
    const [patientsLoading, setPatientsLoading] = React.useState(false)
    const [patientSearch, setPatientSearch] = React.useState("")
    const [selectedPatient, setSelectedPatient] = React.useState<PatientOption | null>(null)
    const [patientDropdownOpen, setPatientDropdownOpen] = React.useState(false)

    React.useEffect(() => {
        if (!open || intakeLink) return
        setPatientsLoading(true)
        fetch("/api/patients")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setPatients(Array.isArray(data) ? data : []))
            .catch(() => setPatients([]))
            .finally(() => setPatientsLoading(false))
    }, [open, intakeLink])

    const filteredPatients = React.useMemo(() => {
        if (!patientSearch.trim()) return patients.slice(0, 8)
        const q = patientSearch.toLowerCase()
        return patients
            .filter(
                (p) =>
                    p.first_name?.toLowerCase().includes(q) ||
                    p.last_name?.toLowerCase().includes(q) ||
                    `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
            )
            .slice(0, 8)
    }, [patients, patientSearch])

    const handleSelectPatient = (p: PatientOption) => {
        setSelectedPatient(p)
        setFormData((prev) => ({
            ...prev,
            patient_first_name: p.first_name || "",
            patient_last_name: p.last_name || "",
            dob: p.date_of_birth ? p.date_of_birth.split("T")[0] : "",
        }))
        setPatientSearch("")
        setPatientDropdownOpen(false)
    }

    const handleClearPatient = () => {
        setSelectedPatient(null)
        setFormData((prev) => ({ ...prev, patient_first_name: "", patient_last_name: "", dob: "" }))
        setPatientSearch("")
    }

    const handleClose = (open: boolean) => {
        if (!open) {
            setIntakeLink(null)
            setFormData({
                patient_first_name: "",
                patient_last_name: "",
                dob: "",
                urgency: "routine",
                reason: "",
            })
            setConsentChecked(false)
            setSelectedPatient(null)
            setPatientSearch("")
            setPatientDropdownOpen(false)
        }
        onOpenChange(open)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!specialist) return

        if (!consentChecked) {
            toast.error("Please confirm patient consent")
            return
        }

        if (!formData.patient_first_name || !formData.patient_last_name || !formData.reason) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        setIntakeLink(null)

        try {
            const response = await fetch("/api/referrals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    specialist_id: specialist.id,
                    consent_confirmed: consentChecked,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create referral")
            }

            toast.success("Referral sent successfully!")
            if (data.intake_link) {
                setIntakeLink(data.intake_link)
                if (preferredShareChannel === "email") {
                    const body = buildReferralIntakeEmailContent(data.intake_link, clinic ?? null)
                    const subject = encodeURIComponent(REFERRAL_INTAKE_EMAIL_SUBJECT)
                    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`, "_blank")
                } else if (preferredShareChannel === "whatsapp") {
                    const text = [
                        "We’d like to connect regarding a patient referral. Please use this secure link to enter your practice details and pin your location on the map. Link expires in 48 hours (one-time use).",
                        "",
                        data.intake_link,
                    ].join("\n")
                    const header = clinic?.name ? `${clinic.name}\n\n` : ""
                    window.open(`https://wa.me/?text=${encodeURIComponent(header + text)}`, "_blank")
                }
            } else {
                onOpenChange(false)
                onSuccess?.()
            }

            if (!data.intake_link) {
                setFormData({
                    patient_first_name: "",
                    patient_last_name: "",
                    dob: "",
                    urgency: "routine",
                    reason: "",
                })
                setConsentChecked(false)
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create referral")
        } finally {
            setLoading(false)
        }
    }

    const copyIntakeLink = () => {
        if (!intakeLink) return
        navigator.clipboard.writeText(intakeLink)
        toast.success("Link copied to clipboard")
    }

    const shareEmail = () => {
        if (!intakeLink) return
        const body = buildReferralIntakeEmailContent(intakeLink, clinic ?? null)
        const subject = encodeURIComponent(REFERRAL_INTAKE_EMAIL_SUBJECT)
        window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`, "_blank")
    }

    const shareWhatsApp = () => {
        if (!intakeLink) return
        const text = [
            "We’d like to connect regarding a patient referral. Please use this secure link to enter your practice details and pin your location on the map. Link expires in 48 hours (one-time use).",
            "",
            intakeLink,
        ].join("\n")
        const header = clinic?.name ? `${clinic.name}\n\n` : ""
        window.open(`https://wa.me/?text=${encodeURIComponent(header + text)}`, "_blank")
    }

    if (!specialist) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Refer Patient</DialogTitle>
                    <DialogDescription>
                        Referring to {specialist.name} - {specialist.specialty.name}
                    </DialogDescription>
                </DialogHeader>

                {intakeLink ? (
                    <div className="space-y-4 mt-4">
                        <p className="text-sm text-slate-600">
                            Share this secure link with {specialist.name}. They can enter their practice details and pin their location on the map. The link expires in 48 hours and can only be used once.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={copyIntakeLink}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy link
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={shareEmail}>
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={shareWhatsApp}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 break-all font-mono bg-slate-50 p-2 rounded">
                            {intakeLink}
                        </p>
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                onClick={() => {
                                    handleClose(false)
                                    onSuccess?.()
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Patient search and select */}
                    <div className="space-y-2">
                        <Label>Patient *</Label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="text-sm font-medium text-slate-900">
                                    {selectedPatient.first_name} {selectedPatient.last_name}
                                    {selectedPatient.date_of_birth && (
                                        <span className="ml-2 text-slate-500 font-normal">
                                            DOB: {selectedPatient.date_of_birth.split("T")[0]}
                                        </span>
                                    )}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-8 w-8 p-0"
                                    onClick={handleClearPatient}
                                    aria-label="Clear selection"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search patient by name..."
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value)
                                        setPatientDropdownOpen(true)
                                    }}
                                    onFocus={() => setPatientDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setPatientDropdownOpen(false), 200)}
                                    className="pl-9"
                                />
                                {patientDropdownOpen && (patientSearch.length > 0 || patients.length > 0) && (
                                    <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-auto">
                                        {patientsLoading ? (
                                            <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading patients...
                                            </div>
                                        ) : filteredPatients.length === 0 ? (
                                            <div className="p-3 text-sm text-slate-500">No patients found. Enter details below.</div>
                                        ) : (
                                            filteredPatients.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between"
                                                    onClick={() => handleSelectPatient(p)}
                                                >
                                                    <span>{p.first_name} {p.last_name}</span>
                                                    {p.date_of_birth && (
                                                        <span className="text-slate-500 text-xs">{p.date_of_birth.split("T")[0]}</span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Patient details (prefilled when selected, editable) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="patient_first_name">First Name *</Label>
                            <Input
                                id="patient_first_name"
                                value={formData.patient_first_name}
                                onChange={(e) => setFormData({ ...formData, patient_first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="patient_last_name">Last Name *</Label>
                            <Input
                                id="patient_last_name"
                                value={formData.patient_last_name}
                                onChange={(e) => setFormData({ ...formData, patient_last_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                            id="dob"
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        />
                    </div>

                    {/* Referral Details */}
                    <div>
                        <Label htmlFor="urgency">Urgency Level *</Label>
                        <Select
                            value={formData.urgency}
                            onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="routine">Routine</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason for Referral *</Label>
                        <Textarea
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Please describe the reason for this referral, relevant symptoms, and any pertinent medical history..."
                            rows={5}
                            required
                        />
                    </div>

                    {/* Consent */}
                    <div className="flex items-start space-x-2 bg-slate-50 p-4 rounded-lg">
                        <Checkbox
                            id="consent"
                            checked={consentChecked}
                            onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                        />
                        <Label htmlFor="consent" className="text-sm font-normal leading-tight cursor-pointer">
                            I confirm that I have obtained patient consent to share their information with {specialist.name} for the purpose of this referral.
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Referral
                        </Button>
                    </div>
                </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
