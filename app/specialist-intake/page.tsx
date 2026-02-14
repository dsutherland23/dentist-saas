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
import { Loader2, CheckCircle2, AlertCircle, MapPin } from "lucide-react"

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
        } catch {
            setError("Unable to load form")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchContext()
    }, [fetchContext])

    const captureGps = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation not supported")
            return
        }
        setGpsError(null)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                })
            },
            () => setGpsError("Location access denied or unavailable")
        )
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || submitting || submitted) return
        setSubmitting(true)
        setError(null)
        try {
            const payload = {
                token,
                ...form,
                ...(gpsCoords && gpsCoords.accuracy < 30
                    ? { lat: gpsCoords.lat, lng: gpsCoords.lng, gps_accuracy: gpsCoords.accuracy }
                    : {}),
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
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (error && !context) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <CardTitle>Unable to load form</CardTitle>
                        </div>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-8 w-8" />
                            <CardTitle>Thank you</CardTitle>
                        </div>
                        <CardDescription>
                            Your practice details have been saved. You may close this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-teal-600" />
                            Specialist intake
                        </CardTitle>
                        <CardDescription>
                            {context?.patient_name
                                ? `Please confirm your practice details for the referral of ${context.patient_name}.`
                                : "Please enter your practice details. Your location will be added to the referral map."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="full_name">Full name *</Label>
                                <Input
                                    id="full_name"
                                    value={form.full_name}
                                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="practice_name">Practice name *</Label>
                                <Input
                                    id="practice_name"
                                    value={form.practice_name}
                                    onChange={(e) => setForm((f) => ({ ...f, practice_name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Specialty *</Label>
                                <Select
                                    value={form.specialty_id}
                                    onValueChange={(v) => setForm((f) => ({ ...f, specialty_id: v }))}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select specialty" />
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
                            <div>
                                <Label htmlFor="address_line_1">Address line 1 *</Label>
                                <Input
                                    id="address_line_1"
                                    value={form.address_line_1}
                                    onChange={(e) => setForm((f) => ({ ...f, address_line_1: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="address_line_2">Address line 2 (optional)</Label>
                                <Input
                                    id="address_line_2"
                                    value={form.address_line_2}
                                    onChange={(e) => setForm((f) => ({ ...f, address_line_2: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="parish_city">Parish / City *</Label>
                                <Input
                                    id="parish_city"
                                    value={form.parish_city}
                                    onChange={(e) => setForm((f) => ({ ...f, parish_city: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={form.country}
                                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={captureGps}>
                                    Use my current location (optional, &lt;30m accuracy overrides address)
                                </Button>
                                {gpsCoords && (
                                    <p className="text-xs text-slate-500">
                                        Location captured (accuracy ~{Math.round(gpsCoords.accuracy)}m)
                                    </p>
                                )}
                                {gpsError && <p className="text-xs text-amber-600">{gpsError}</p>}
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button type="submit" disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function SpecialistIntakePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
            </div>
        }>
            <SpecialistIntakeContent />
        </Suspense>
    )
}
