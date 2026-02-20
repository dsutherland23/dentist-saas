"use client"

import React, { useState, useRef, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Camera, Upload, Loader2 } from "lucide-react"
import { runOcr, parseIdFields, parseInsuranceFields, type IdFields, type InsuranceFields } from "@/lib/document-ocr"

export type DocumentScanMode = "id" | "insurance"

interface DocumentScanFlowProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: DocumentScanMode
    onApplyId?: (fields: IdFields, imageBlob?: Blob) => void
    onApplyInsurance?: (fields: InsuranceFields, imageBlob?: Blob) => void
    title?: string
    description?: string
}

export function DocumentScanFlow({
    open,
    onOpenChange,
    mode,
    onApplyId,
    onApplyInsurance,
    title,
    description,
}: DocumentScanFlowProps) {
    const [step, setStep] = useState<"capture" | "processing" | "review">("capture")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageBlob, setImageBlob] = useState<Blob | null>(null)
    const [rawText, setRawText] = useState("")
    const [idFields, setIdFields] = useState<IdFields | null>(null)
    const [insuranceFields, setInsuranceFields] = useState<InsuranceFields | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)

    const reset = () => {
        setStep("capture")
        setImagePreview(null)
        setImageBlob(null)
        setRawText("")
        setIdFields(null)
        setInsuranceFields(null)
        setError(null)
        if (stream) {
            stream.getTracks().forEach((t) => t.stop())
            setStream(null)
        }
    }

    const handleClose = (open: boolean) => {
        if (!open) reset()
        onOpenChange(open)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith("image/")) {
            setError("Please select an image file (JPG, PNG, etc.)")
            return
        }
        setError(null)
        const url = URL.createObjectURL(file)
        setImagePreview(url)
        setImageBlob(file)
        setStep("processing")
        runOcrOnBlob(file)
        e.target.value = ""
    }

    const runOcrOnBlob = async (blob: Blob) => {
        setError(null)
        try {
            const text = await runOcr(blob)
            setRawText(text)
            if (mode === "id") {
                setIdFields(parseIdFields(text))
            } else {
                setInsuranceFields(parseInsuranceFields(text))
            }
            setStep("review")
        } catch (err) {
            console.error("[DocumentScanFlow] OCR error", err)
            setError(err instanceof Error ? err.message : "OCR failed. Try a clearer image.")
            setStep("review")
        }
    }

    // Attach stream to video element after it mounts (video only renders when stream is set)
    useEffect(() => {
        if (!stream || !videoRef.current) return
        videoRef.current.srcObject = stream
        return () => {
            if (videoRef.current) videoRef.current.srcObject = null
        }
    }, [stream])

    const startCamera = async () => {
        setError(null)
        try {
            let s: MediaStream | null = null
            try {
                s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
            } catch {
                try {
                    s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
                } catch {
                    s = await navigator.mediaDevices.getUserMedia({ video: true })
                }
            }
            if (s) setStream(s)
        } catch (err) {
            console.error("[DocumentScanFlow] camera error", err)
            setError("Camera access denied or unavailable.")
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop())
            setStream(null)
        }
        if (videoRef.current) videoRef.current.srcObject = null
    }

    const captureFromCamera = () => {
        const video = videoRef.current
        if (!video || !stream) return
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) {
            setError("Waiting for video. Try again in a moment.")
            return
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(
            (blob) => {
                if (!blob) return
                stopCamera()
                const url = URL.createObjectURL(blob)
                setImagePreview(url)
                setImageBlob(blob)
                setStep("processing")
                runOcrOnBlob(blob)
            },
            "image/jpeg",
            0.9
        )
    }

    const handleApply = () => {
        if (mode === "id" && idFields && onApplyId) {
            onApplyId(idFields, imageBlob ?? undefined)
        } else if (mode === "insurance" && insuranceFields && onApplyInsurance) {
            onApplyInsurance(insuranceFields, imageBlob ?? undefined)
        }
        handleClose(false)
    }

    const hasAnyData =
        (mode === "id" && idFields && (idFields.firstName || idFields.lastName || idFields.dateOfBirth || idFields.phone || idFields.address || idFields.email)) ||
        (mode === "insurance" && insuranceFields && (insuranceFields.insuranceProvider || insuranceFields.policyOrMemberId))

    const defaultTitle = mode === "id" ? "Scan ID or document" : "Scan insurance card"
    const defaultDesc = mode === "id"
        ? "Capture or upload an image of an ID or passport to extract name, DOB, and contact info."
        : "Capture or upload an image of the insurance card to extract provider and policy number."

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title ?? defaultTitle}</DialogTitle>
                    <DialogDescription>{description ?? defaultDesc}</DialogDescription>
                </DialogHeader>

                {step === "capture" && (
                    <div className="space-y-4 py-2">
                        {!stream ? (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={startCamera}>
                                    <Camera className="h-4 w-4 mr-2" />
                                    Use camera
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload image
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={captureFromCamera}>
                                        <Camera className="h-4 w-4 mr-2" />
                                        Capture
                                    </Button>
                                    <Button type="button" variant="outline" onClick={stopCamera}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    </div>
                )}

                {step === "processing" && (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                        <p className="text-sm text-slate-600">Reading document…</p>
                    </div>
                )}

                {step === "review" && (
                    <div className="space-y-4 py-2">
                        {imagePreview && (
                            <div className="rounded-lg overflow-hidden border bg-slate-50 max-h-32">
                                <img src={imagePreview} alt="Scanned" className="w-full h-auto object-contain max-h-32" />
                            </div>
                        )}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {mode === "id" && idFields && (
                            <div className="rounded-lg border bg-slate-50 p-3 space-y-2 text-sm">
                                <p className="font-medium text-slate-700">Extracted</p>
                                {(idFields.firstName || idFields.lastName) && (
                                    <p><span className="text-slate-500">Name:</span> {[idFields.firstName, idFields.lastName].filter(Boolean).join(" ")}</p>
                                )}
                                {idFields.dateOfBirth && <p><span className="text-slate-500">DOB:</span> {idFields.dateOfBirth}</p>}
                                {idFields.phone && <p><span className="text-slate-500">Phone:</span> {idFields.phone}</p>}
                                {idFields.email && <p><span className="text-slate-500">Email:</span> {idFields.email}</p>}
                                {idFields.address && <p><span className="text-slate-500">Address:</span> {idFields.address}</p>}
                                {idFields.documentNumber && <p><span className="text-slate-500">Doc #:</span> {idFields.documentNumber}</p>}
                            </div>
                        )}
                        {mode === "insurance" && insuranceFields && (
                            <div className="rounded-lg border bg-slate-50 p-3 space-y-2 text-sm">
                                <p className="font-medium text-slate-700">Extracted</p>
                                {insuranceFields.insuranceProvider && (
                                    <p><span className="text-slate-500">Provider:</span> {insuranceFields.insuranceProvider}</p>
                                )}
                                {insuranceFields.policyOrMemberId && (
                                    <p><span className="text-slate-500">Policy / Member ID:</span> {insuranceFields.policyOrMemberId}</p>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStep("capture")}>
                                New scan
                            </Button>
                            <Button type="button" onClick={handleApply} disabled={!hasAnyData}>
                                Apply to form
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
