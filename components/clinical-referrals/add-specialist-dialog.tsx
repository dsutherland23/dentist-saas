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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { AddressMapPicker } from "./address-map-picker"

interface Specialty {
    id: string
    name: string
}

interface AddSpecialistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialties: Specialty[]
    onSuccess?: () => void
}

export function AddSpecialistDialog({
    open,
    onOpenChange,
    specialties,
    onSuccess,
}: AddSpecialistDialogProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.specialty_id) {
            toast.error("Name and specialty are required")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/specialists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    adminAdd: true,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to add specialist")
            }

            toast.success("Specialist added successfully!")
            onOpenChange(false)
            onSuccess?.()

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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add specialist")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-teal-600" />
                        Add Specialist
                    </DialogTitle>
                    <DialogDescription>
                        Add a specialist to the referral directory. They will appear on the map immediately.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

                    <div>
                        <Label htmlFor="clinic_name">Clinic/Hospital Name</Label>
                        <Input
                            id="clinic_name"
                            value={formData.clinic_name}
                            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        />
                    </div>

                    <AddressMapPicker
                        address={formData.address}
                        city={formData.city}
                        parish={formData.parish}
                        lat={formData.lat}
                        lng={formData.lng}
                        onUpdate={(u) => setFormData((prev) => ({ ...prev, ...u }))}
                    />

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
                            />
                        </div>
                    </div>

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
                            placeholder="Brief description of practice and expertise..."
                            rows={3}
                        />
                    </div>

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
                            Add Specialist
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
