"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

function ensureWebsiteProtocol(url: string): string {
    const t = (url || "").trim()
    if (!t) return ""
    if (/^https?:\/\//i.test(t)) return t
    return `https://${t}`
}

interface Specialist {
    id: string
    name: string
    specialty: { name: string; id: string }
    clinic_name?: string
    address?: string
    city?: string
    parish?: string
    country?: string
    lat?: number
    lng?: number
    phone?: string
    email?: string
    website?: string
    bio?: string
}

interface Specialty {
    id: string
    name: string
}

interface EditSpecialistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialist: Specialist | null
    specialties: Specialty[]
    onSuccess?: () => void
}

export function EditSpecialistDialog({
    open,
    onOpenChange,
    specialist,
    specialties,
    onSuccess,
}: EditSpecialistDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        specialty_id: "",
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

    useEffect(() => {
        if (specialist && open) {
            setFormData({
                name: specialist.name ?? "",
                specialty_id: specialist.specialty?.id ?? "",
                clinic_name: specialist.clinic_name ?? "",
                address: specialist.address ?? "",
                city: specialist.city ?? "",
                parish: specialist.parish ?? "",
                country: specialist.country ?? "Jamaica",
                lat: specialist.lat != null ? Number(specialist.lat) : 18.1096,
                lng: specialist.lng != null ? Number(specialist.lng) : -77.2975,
                phone: specialist.phone ?? "",
                email: specialist.email ?? "",
                website: specialist.website ?? "",
                bio: specialist.bio ?? "",
            })
        }
    }, [specialist, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!specialist?.id || !formData.name || !formData.specialty_id) {
            toast.error("Name and specialty are required")
            return
        }
        setLoading(true)
        try {
            const websiteValue = ensureWebsiteProtocol(formData.website)
            const res = await fetch("/api/specialists", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: specialist.id,
                    name: formData.name,
                    specialty_id: formData.specialty_id,
                    clinic_name: formData.clinic_name || null,
                    address: formData.address || null,
                    city: formData.city || null,
                    parish: formData.parish || null,
                    country: formData.country || "Jamaica",
                    lat: formData.lat,
                    lng: formData.lng,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    website: websiteValue || null,
                    bio: formData.bio || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to update")
            toast.success("Specialist card updated")
            onOpenChange(false)
            onSuccess?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update")
        } finally {
            setLoading(false)
        }
    }

    if (!specialist) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit your specialist card</DialogTitle>
                    <DialogDescription>
                        Update your practice details shown on the specialist map.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="edit-name">Full name *</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <Label>Specialty *</Label>
                        <Select
                            value={formData.specialty_id}
                            onValueChange={(v) => setFormData((p) => ({ ...p, specialty_id: v }))}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                {specialties.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="edit-clinic_name">Practice name</Label>
                        <Input
                            id="edit-clinic_name"
                            value={formData.clinic_name}
                            onChange={(e) => setFormData((p) => ({ ...p, clinic_name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-address">Address</Label>
                        <Input
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-city">City</Label>
                            <Input
                                id="edit-city"
                                value={formData.city}
                                onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-parish">Parish / State</Label>
                            <Input
                                id="edit-parish"
                                value={formData.parish}
                                onChange={(e) => setFormData((p) => ({ ...p, parish: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-lat">Latitude</Label>
                            <Input
                                id="edit-lat"
                                type="number"
                                step="any"
                                value={formData.lat}
                                onChange={(e) => setFormData((p) => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-lng">Longitude</Label>
                            <Input
                                id="edit-lng"
                                type="number"
                                step="any"
                                value={formData.lng}
                                onChange={(e) => setFormData((p) => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="edit-website">Website</Label>
                        <Input
                            id="edit-website"
                            placeholder="https://..."
                            value={formData.website}
                            onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-bio">Bio</Label>
                        <Textarea
                            id="edit-bio"
                            value={formData.bio}
                            onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                            placeholder="Brief description of your practice..."
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
