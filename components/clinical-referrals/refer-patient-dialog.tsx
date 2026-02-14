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
import { Loader2, Copy, Mail, MessageCircle } from "lucide-react"
import { toast } from "sonner"

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
}

export function ReferPatientDialog({
    open,
    onOpenChange,
    specialist,
    preferredShareChannel,
    onSuccess,
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
                    const subject = encodeURIComponent("Referral intake – please confirm your practice details")
                    const body = encodeURIComponent(
                        `Please use the link below to confirm your practice details and location for the referral.\n\n${data.intake_link}\n\nThis link expires in 48 hours and can only be used once.`
                    )
                    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
                } else if (preferredShareChannel === "whatsapp") {
                    const text = encodeURIComponent(
                        `Please confirm your practice details for the referral using this link (expires in 48 hours, one-time use):\n${data.intake_link}`
                    )
                    window.open(`https://wa.me/?text=${text}`, "_blank")
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
        const subject = encodeURIComponent("Referral intake – please confirm your practice details")
        const body = encodeURIComponent(
            `Please use the link below to confirm your practice details and location for the referral.\n\n${intakeLink}\n\nThis link expires in 48 hours and can only be used once.`
        )
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
    }

    const shareWhatsApp = () => {
        if (!intakeLink) return
        const text = encodeURIComponent(
            `Please confirm your practice details for the referral using this link (expires in 48 hours, one-time use):\n${intakeLink}`
        )
        window.open(`https://wa.me/?text=${text}`, "_blank")
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
                            Share this secure intake link with {specialist.name}. They can confirm their practice details and location (link expires in 48 hours, one-time use).
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
                    {/* Patient Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="patient_first_name">Patient First Name *</Label>
                            <Input
                                id="patient_first_name"
                                value={formData.patient_first_name}
                                onChange={(e) => setFormData({ ...formData, patient_first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="patient_last_name">Patient Last Name *</Label>
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
