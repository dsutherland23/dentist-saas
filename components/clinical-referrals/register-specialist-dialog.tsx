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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Specialty {
    id: string
    name: string
}

interface RegisterSpecialistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialties: Specialty[]
    onSuccess?: () => void
}

export function RegisterSpecialistDialog({
    open,
    onOpenChange,
    specialties,
    onSuccess,
}: RegisterSpecialistDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: "",
        specialty_id: "",
        license_number: "",
        clinic_name: "",
        address: "",
        city: "",
        parish: "",
        country: "Jamaica",
        lat: 18.1096,
        lng: -77.2975,
        phone: "",
        email: "",
        website: "",
        bio: "",
    })
    const [consentChecked, setConsentChecked] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!consentChecked) {
            toast.error("Please accept the verification terms")
            return
        }

        if (!formData.name || !formData.specialty_id) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/specialists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to submit registration")
            }

            toast.success("Registration submitted! Admin will review your application.")
            onOpenChange(false)
            onSuccess?.()

            // Reset form
            setFormData({
                name: "",
                specialty_id: "",
                license_number: "",
                clinic_name: "",
                address: "",
                city: "",
                parish: "",
                country: "Jamaica",
                lat: 18.1096,
                lng: -77.2975,
                phone: "",
                email: "",
                website: "",
                bio: "",
            })
            setConsentChecked(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to submit registration")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register as a Specialist</DialogTitle>
                    <DialogDescription>
                        Fill in your details to appear on the specialist map. Your registration will be reviewed by an administrator.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Personal Information */}
                    <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="specialty">Specialty *</Label>
                        <Select
                            value={formData.specialty_id}
                            onValueChange={(value) => setFormData({ ...formData, specialty_id: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                {specialties.map((specialty) => (
                                    <SelectItem key={specialty.id} value={specialty.id}>
                                        {specialty.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                            id="license_number"
                            value={formData.license_number}
                            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        />
                    </div>

                    {/* Practice Information */}
                    <div>
                        <Label htmlFor="clinic_name">Clinic/Hospital Name</Label>
                        <Input
                            id="clinic_name"
                            value={formData.clinic_name}
                            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="parish">Parish</Label>
                            <Input
                                id="parish"
                                value={formData.parish}
                                onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                                placeholder="e.g., Kingston"
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Brief description of your practice and expertise..."
                            rows={3}
                        />
                    </div>

                    {/* Consent */}
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="consent"
                            checked={consentChecked}
                            onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                        />
                        <Label htmlFor="consent" className="text-sm font-normal leading-tight cursor-pointer">
                            I confirm that all information provided is accurate and I consent to appearing on the specialist directory pending admin approval.
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
                            Submit Registration
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
