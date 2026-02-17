"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Camera, Upload, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import Webcam from "react-webcam"
import Cropper from "react-easy-crop"

type Point = { x: number; y: number }
type Area = { x: number; y: number; width: number; height: number }

interface ProfilePictureUploadProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentImageUrl?: string | null
    onUploadComplete: (imageUrl: string) => void
    uploadEndpoint: string
    title?: string
    description?: string
}

export function ProfilePictureUpload({
    open,
    onOpenChange,
    currentImageUrl,
    onUploadComplete,
    uploadEndpoint,
    title = "Update Profile Picture",
    description = "Upload a photo or take one with your camera"
}: ProfilePictureUploadProps) {
    const [mode, setMode] = useState<"select" | "upload" | "camera" | "crop">("select")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    
    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB")
                return
            }
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setMode("crop")
        }
    }

    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
                    setSelectedFile(file)
                    setPreviewUrl(imageSrc)
                    setMode("crop")
                })
        }
    }, [webcamRef])

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createCroppedImage = async (imageUrl: string, pixelCrop: Area): Promise<Blob> => {
        const image = await createImage(imageUrl)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
            throw new Error("No 2d context")
        }

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
            }, "image/jpeg", 0.95)
        })
    }

    const createImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener("load", () => resolve(image))
            image.addEventListener("error", (error) => reject(error))
            image.setAttribute("crossOrigin", "anonymous")
            image.src = url
        })
    }

    const handleUpload = async () => {
        if (!selectedFile || !previewUrl || !croppedAreaPixels) return

        setUploading(true)
        try {
            const croppedBlob = await createCroppedImage(previewUrl, croppedAreaPixels)
            const croppedFile = new File([croppedBlob], selectedFile.name, { type: "image/jpeg" })

            const formData = new FormData()
            formData.append("file", croppedFile)

            const response = await fetch(uploadEndpoint, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Upload failed")
            }

            const data = await response.json()
            toast.success("Profile picture updated successfully")
            onUploadComplete(data.url)
            handleClose()
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setMode("select")
        setSelectedFile(null)
        setPreviewUrl(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {mode === "select" && (
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-32 flex-col gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8" />
                                <span>Upload Photo</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-32 flex-col gap-2"
                                onClick={() => setMode("camera")}
                            >
                                <Camera className="h-8 w-8" />
                                <span>Take Photo</span>
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {mode === "camera" && (
                        <div className="space-y-4">
                            <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ width: 1280, height: 1280, facingMode: "user" }}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setMode("select")} variant="outline" className="flex-1">
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button onClick={capturePhoto} className="flex-1">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Capture
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === "crop" && previewUrl && (
                        <div className="space-y-4">
                            <div className="relative h-96 bg-slate-100 rounded-lg overflow-hidden">
                                <Cropper
                                    image={previewUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Zoom</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {mode === "crop" && (
                        <>
                            <Button onClick={() => setMode("select")} variant="outline" disabled={uploading}>
                                Back
                            </Button>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Save Photo"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
