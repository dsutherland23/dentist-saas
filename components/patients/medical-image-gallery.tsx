"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"

interface MedicalImage {
    id: string
    name: string
    file_path: string
    created_at: string
}

interface MedicalImageGalleryProps {
    images: MedicalImage[]
    onDelete: (id: string) => Promise<void>
    onDownload: (id: string, name: string) => void
}

export function MedicalImageGallery({ images, onDelete, onDownload }: MedicalImageGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState(-1)
    const [deleting, setDeleting] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this image?")) return
        
        setDeleting(id)
        try {
            await onDelete(id)
            toast.success("Image deleted")
        } catch (error) {
            toast.error("Failed to delete image")
        } finally {
            setDeleting(null)
        }
    }

    if (images.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <p>No images uploaded yet</p>
            </div>
        )
    }

    const lightboxSlides = images.map(img => ({
        src: img.file_path
    }))

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-teal-300 transition-colors"
                    >
                        <img
                            src={image.file_path}
                            alt={image.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => setLightboxIndex(index)}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => onDownload(image.id, image.name)}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleDelete(image.id)}
                                disabled={deleting === image.id}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white truncate">{image.name}</p>
                            <p className="text-xs text-white/70">
                                {format(new Date(image.created_at), "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={lightboxSlides}
            />
        </>
    )
}
