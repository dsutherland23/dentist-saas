"use client"

import React, { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle, MapPin, Building2, Phone, Navigation } from "lucide-react"
import dynamic from "next/dynamic"

const AddressMapInner = dynamic(
    () => import("@/components/clinical-referrals/address-map-inner").then((m) => ({ default: m.AddressMapInner })),
    { ssr: false, loading: () => <div className="h-[240px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center"><MapPin className="h-10 w-10 text-slate-300" /></div> }
)

interface Specialty {
    id: string
    name: string
}

interface Context {
    referral_id: string
    patient_name: string
    specialist_name: string
    specialties: Specialty[]
}

function SpecialistIntakeContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [context, setContext] = useState<Context | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const [form, setForm] = useState({
        full_name: "",
        practice_name: "",
        specialty_id: "",
        address_line_1: "",
        address_line_2: "",
        parish_city: "",
        country: "Jamaica",
        phone: "",
        email: "",
    })
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
    const [gpsError, setGpsError] = useState<string | null>(null)

    const fetchContext = useCallback(async () => {
        if (!token || token.length < 32) {
            setError("Invalid or missing link")
            setLoading(false)
            return
        }
        try {
            const res = await fetch(`/api/specialist-intake?token=${encodeURIComponent(token)}`)
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Invalid or expired link")
                setLoading(false)
                return
            }
            setContext(data)
            setForm((f) => ({ ...f, full_name: data.specialist_name || f.full_name }))
            setMapCoords(null)
            setGpsCoords(null)
        } catch {
            setError("Unable to load form")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchContext()
    }, [fetchContext])

    const defaultLat = 18.1096
    const defaultLng = -77.2975
    const mapLat = mapCoords?.lat ?? gpsCoords?.lat ?? defaultLat
    const mapLng = mapCoords?.lng ?? gpsCoords?.lng ?? defaultLng

    const captureGps = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser")
            return
        }
        setGpsError(null)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                }
                setGpsCoords(coords)
                setMapCoords({ lat: coords.lat, lng: coords.lng })
            },
            () => setGpsError("Location access was denied or is unavailable. You can still drag the map marker to your practice location.")
        )
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || submitting || submitted) return
        setSubmitting(true)
        setError(null)
        try {
            const payload: Record<string, unknown> = {
                token,
                ...form,
            }
            if (mapCoords) {
                payload.lat = mapCoords.lat
                payload.lng = mapCoords.lng
                payload.gps_accuracy = 0
            } else if (gpsCoords && gpsCoords.accuracy < 30) {
                payload.lat = gpsCoords.lat
                payload.lng = gpsCoords.lng
                payload.gps_accuracy = gpsCoords.accuracy
            }
            const res = await fetch("/api/specialist-intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Submission failed")
                setSubmitting(false)
                return
            }
            setSubmitted(true)
        } catch {
            setError("Network error. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                    <p className="text-slate-600 font-medium">Loading form...</p>
                </div>
            </div>
        )
    }

    if (error && !context) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full shadow-lg border-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertCircle className="h-6 w-6 shrink-0" />
                            <CardTitle className="text-xl">Unable to load form</CardTitle>
                        </div>
                        <CardDescription className="text-slate-600 mt-1">{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full shadow-lg border-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl text-slate-900">Thank you</CardTitle>
                        <CardDescription className="text-base mt-2 text-slate-600">
                            Your practice details have been saved. You may close this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4 sm:py-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Confirm your practice details
                    </h1>
                    <p className="text-slate-600 mt-2 max-w-lg mx-auto">
                        {context?.patient_name
                            ? `Please enter your practice information and pin your location for the referral of ${context.patient_name}.`
                            : "Enter your practice information and pin your location on the map so we can add you to our referral network."}
                    </p>
                </div>

                <Card className="shadow-xl border-slate-200 rounded-2xl overflow-hidden">
                    <CardContent className="p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Practice information */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Building2 className="h-5 w-5 text-teal-600" />
                                    <h2 className="text-lg font-semibold">Practice information</h2>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full name *</Label>
                                        <Input
                                            id="full_name"
                                            value={form.full_name}
                                            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="practice_name">Practice name *</Label>
                                        <Input
                                            id="practice_name"
                                            value={form.practice_name}
                                            onChange={(e) => setForm((f) => ({ ...f, practice_name: e.target.value }))}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Specialty *</Label>
                                    <Select
                                        value={form.specialty_id}
                                        onValueChange={(v) => setForm((f) => ({ ...f, specialty_id: v }))}
                                        required
                                    >
                                        <SelectTrigger className="rounded-lg">
                                            <SelectValue placeholder="Select your specialty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(context?.specialties ?? []).map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>

                            {/* Address */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <MapPin className="h-5 w-5 text-teal-600" />
                                    <h2 className="text-lg font-semibold">Practice address</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="address_line_1">Address line 1 *</Label>
                                        <Input
                                            id="address_line_1"
                                            value={form.address_line_1}
                                            onChange={(e) => setForm((f) => ({ ...f, address_line_1: e.target.value }))}
                                            required
                                            placeholder="Street address"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_line_2">Address line 2 (optional)</Label>
                                        <Input
                                            id="address_line_2"
                                            value={form.address_line_2}
                                            onChange={(e) => setForm((f) => ({ ...f, address_line_2: e.target.value }))}
                                            placeholder="Suite, unit, building"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="parish_city">Parish / City *</Label>
                                            <Input
                                                id="parish_city"
                                                value={form.parish_city}
                                                onChange={(e) => setForm((f) => ({ ...f, parish_city: e.target.value }))}
                                                required
                                                className="rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={form.country}
                                                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                                className="rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Contact */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Phone className="h-5 w-5 text-teal-600" />
                                    <h2 className="text-lg font-semibold">Contact details</h2>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Map: pin your location */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Navigation className="h-5 w-5 text-teal-600" />
                                    <h2 className="text-lg font-semibold">Pin your practice location</h2>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Drag the marker to your practice location on the map, or use the button below to set it from your device’s location.
                                </p>
                                <div className="rounded-xl overflow-hidden border border-slate-200">
                                    <AddressMapInner
                                        lat={mapLat}
                                        lng={mapLng}
                                        onPositionChange={(lat, lng) => {
                                            setMapCoords({ lat, lng })
                                            setGpsCoords(null)
                                        }}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button type="button" variant="outline" size="sm" onClick={captureGps} className="rounded-lg">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Use my current location
                                    </Button>
                                    {gpsCoords && (
                                        <span className="text-xs text-slate-500">
                                            Location set (accuracy ~{Math.round(gpsCoords.accuracy)}m)
                                        </span>
                                    )}
                                    {mapCoords && !gpsCoords && (
                                        <span className="text-xs text-slate-500">
                                            Location set from map
                                        </span>
                                    )}
                                </div>
                                {gpsError && (
                                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        {gpsError}
                                    </p>
                                )}
                            </section>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-12 text-base font-semibold bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Submit practice details"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-500 mt-6">
                    This is a one-time, secure form. Your details will be used only for this referral and to display your practice on our referral map.
                </p>
            </div>
        </div>
    )
}

export default function SpecialistIntakePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                </div>
            }
        >
            <SpecialistIntakeContent />
        </Suspense>
    )
}
