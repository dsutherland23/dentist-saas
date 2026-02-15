"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
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
import { Loader2, MapPin, Building2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const AddressMapInner = dynamic(() => import("./address-map-inner").then((m) => ({ default: m.AddressMapInner })), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[220px] bg-slate-50 border border-slate-200 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
    ),
})

function ensureWebsiteProtocol(url: string): string {
    const t = (url || "").trim()
    if (!t) return ""
    if (/^https?:\/\//i.test(t)) return t
    return `https://${t}`
}

interface Specialty {
    id: string
    name: string
}

interface ClinicData {
    id?: string
    name?: string
    email?: string
    phone?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    logo_url?: string
    business_hours?: { weekday?: string; weekend?: string }
}

interface AddYourselfSpecialistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialties: Specialty[]
    userDisplayName: string
    isAdmin?: boolean
    onSuccess?: () => void
}

export function AddYourselfSpecialistDialog({
    open,
    onOpenChange,
    specialties,
    userDisplayName,
    isAdmin = false,
    onSuccess,
}: AddYourselfSpecialistDialogProps) {
    const [loading, setLoading] = useState(false)
    const [clinicLoading, setClinicLoading] = useState(true)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationCaptured, setLocationCaptured] = useState(false)
    const [locationDenied, setLocationDenied] = useState(false)
    const [clinic, setClinic] = useState<ClinicData | null>(null)
    const [formData, setFormData] = useState({
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
        business_hours: "",
        bio: "",
    })

    useEffect(() => {
        if (!open) return
        setClinicLoading(true)
        setLocationDenied(false)
        setLocationCaptured(false)
        fetch("/api/settings/clinic")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                setClinic(data)
                if (data) {
                    const hours = data.business_hours
                    const hoursStr =
                        typeof hours === "object"
                            ? [hours?.weekday, hours?.weekend].filter(Boolean).join("; ")
                            : ""
                    setFormData((prev) => ({
                        ...prev,
                        name: userDisplayName || prev.name,
                        clinic_name: data.name ?? "",
                        email: data.email ?? "",
                        phone: data.phone ?? "",
                        website: ensureWebsiteProtocol(data.website ?? ""),
                        address: data.address ?? "",
                        city: data.city ?? "",
                        parish: data.state ?? "",
                        business_hours: hoursStr || "Weekday: 9:00 AM - 6:00 PM; Weekend: Closed",
                    }))
                } else {
                    setFormData((prev) => ({ ...prev, name: userDisplayName || prev.name }))
                }
            })
            .catch(() => setClinic(null))
            .finally(() => setClinicLoading(false))
    }, [open, userDisplayName])

    const requestLocation = () => {
        setLocationLoading(true)
        setLocationDenied(false)
        setLocationCaptured(false)
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser")
            setLocationLoading(false)
            return
        }
        if (typeof window !== "undefined" && !window.isSecureContext) {
            toast.error("Location requires HTTPS (or localhost). Use the address fields below instead.")
            setLocationLoading(false)
            return
        }
        toast.info("Requesting your location... This may take a few seconds.")
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData((prev) => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                }))
                setLocationCaptured(true)
                toast.success(`Location captured! Pin will be at your current location.`)
                setLocationLoading(false)
            },
            (err) => {
                setLocationDenied(true)
                setLocationCaptured(false)
                const msg =
                    err.code === err.PERMISSION_DENIED
                        ? "Location denied. Allow location for this site in browser settings, or enter address below."
                        : err.code === err.POSITION_UNAVAILABLE
                          ? "Location unavailable. Enter address below."
                          : "Location timed out. Check if location services are enabled, or enter address below."
                toast.error(msg)
                setLocationLoading(false)
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.specialty_id) {
            toast.error("Name and specialty are required")
            return
        }
        setLoading(true)
        try {
            const websiteValue = ensureWebsiteProtocol(formData.website)
            const res = await fetch("/api/specialists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    website: websiteValue,
                    bio: formData.business_hours
                        ? `Business hours: ${formData.business_hours}${formData.bio ? "\n\n" + formData.bio : ""}`
                        : formData.bio,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to register")
            toast.success("Registration submitted! Admin will review and add your pin to the map.")
            onOpenChange(false)
            onSuccess?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to register")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        Add yourself as a specialist
                    </DialogTitle>
                    <DialogDescription>
                        {isAdmin
                            ? "Add your practice to the specialist map. As an admin, you’ll be listed immediately. We’ll use your practice info from Settings and your location for the pin."
                            : "We’ll use your practice information from Settings and your location to add a pin to the map. Your registration will be reviewed by an administrator. Please complete this at your place of practice so your pin is accurate."}
                    </DialogDescription>
                </DialogHeader>

                {clinicLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        {clinic?.logo_url && (
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <img
                                    src={clinic.logo_url}
                                    alt="Practice logo"
                                    className="h-14 w-14 object-contain rounded"
                                />
                                <p className="text-sm text-slate-600">Logo from Settings → Practice Information</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Add your pin to the map</Label>
                            <p className="text-xs text-slate-500">
                                Click the button to capture your current location. Your pin will appear on the map below.
                            </p>
                            <Button
                                type="button"
                                variant={locationCaptured ? "default" : "outline"}
                                size="sm"
                                onClick={requestLocation}
                                disabled={locationLoading}
                                className={locationCaptured ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                                {locationLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : locationCaptured ? (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                ) : (
                                    <MapPin className="h-4 w-4 mr-2" />
                                )}
                                {locationCaptured ? "Location captured" : "Use my current location"}
                            </Button>
                            {locationDenied && (
                                <p className="text-xs text-amber-600">Location blocked or denied. Enter address below for geocoding.</p>
                            )}
                            {locationCaptured && (
                                <div className="mt-2">
                                    <AddressMapInner
                                        lat={formData.lat}
                                        lng={formData.lng}
                                        onPositionChange={(lat, lng) => setFormData((p) => ({ ...p, lat, lng }))}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Drag the marker to adjust your pin location.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="name">Full name *</Label>
                            <Input
                                id="name"
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
                            <Label htmlFor="clinic_name">Practice name *</Label>
                            <Input
                                id="clinic_name"
                                value={formData.clinic_name}
                                onChange={(e) => setFormData((p) => ({ ...p, clinic_name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="website">Website</Label>
                            <div className="flex items-center border rounded-md bg-slate-50 border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
                                <span className="pl-3 text-slate-500 text-sm">https://</span>
                                <Input
                                    id="website"
                                    type="text"
                                    inputMode="url"
                                    value={(formData.website || "").replace(/^https?:\/\//i, "")}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/^https?:\/\//i, "")
                                        setFormData((p) => ({ ...p, website: v ? `https://${v}` : v }))
                                    }}
                                    onBlur={(e) => {
                                        const v = (e.target.value || "").trim()
                                        if (v) setFormData((p) => ({ ...p, website: ensureWebsiteProtocol(v) }))
                                    }}
                                    placeholder="example.com"
                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="parish">Parish / State</Label>
                                <Input
                                    id="parish"
                                    value={formData.parish}
                                    onChange={(e) => setFormData((p) => ({ ...p, parish: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="business_hours">Business hours</Label>
                            <Input
                                id="business_hours"
                                value={formData.business_hours}
                                onChange={(e) => setFormData((p) => ({ ...p, business_hours: e.target.value }))}
                                placeholder="e.g. Mon–Fri 9am–6pm; Sat 9am–1pm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bio">Bio (optional)</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                                placeholder="Brief description of your practice..."
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isAdmin ? "Add to map" : "Submit for approval"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
