"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Phone, Mail, ExternalLink, Globe, Stethoscope, Pencil } from "lucide-react"
import { EditSpecialistDialog } from "./edit-specialist-dialog"

interface Specialist {
    id: string
    name: string
    specialty: { name: string; id: string }
    clinic_name?: string
    city?: string
    parish?: string
    lat: number
    lng: number
    phone?: string
    email?: string
    website?: string
    bio?: string
    status?: string
    user_id?: string | null
}

interface Specialty {
    id: string
    name: string
}

interface SpecialistDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialist: Specialist | null
    onReferClick?: (specialist: Specialist) => void
    currentUserId?: string | null
    isAdmin?: boolean
    specialties?: Specialty[]
    onEditSuccess?: () => void
}

export function SpecialistDetailsDialog({
    open,
    onOpenChange,
    specialist,
    onReferClick,
    currentUserId,
    isAdmin,
    specialties = [],
    onEditSuccess,
}: SpecialistDetailsDialogProps) {
    const [editOpen, setEditOpen] = useState(false)
    if (!specialist) return null

    const canEdit =
        (specialist.user_id && currentUserId && specialist.user_id === currentUserId) || isAdmin

    const handleEditSuccess = () => {
        onEditSuccess?.()
        setEditOpen(false)
        onOpenChange(false)
    }

    const initials = specialist.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{specialist.name}</DialogTitle>
                    <DialogDescription>
                        Details for specialist {specialist.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-8 text-white relative">
                    <div className="flex items-center gap-6 relative z-10">
                        <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                            <AvatarFallback className="bg-white text-teal-700 text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight">{specialist.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1">
                                    <Stethoscope className="h-3 w-3 mr-1.5 opacity-80" />
                                    {specialist.specialty.name}
                                </Badge>
                                {specialist.status === 'approved' && (
                                    <Badge className="bg-emerald-400 text-emerald-900 border-none px-3 py-1">
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Stethoscope className="h-32 w-32" />
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-white">
                    {/* Bio Section */}
                    {specialist.bio && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">About Specialist</h3>
                            <p className="text-slate-600 leading-relaxed text-lg italic">
                                "{specialist.bio}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Practice Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Practice Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm leading-none mb-1">{specialist.clinic_name || "Private Practice"}</p>
                                        <p className="text-xs text-slate-500">{[specialist.city, specialist.parish].filter(Boolean).join(", ")}</p>
                                    </div>
                                </div>
                                {specialist.website && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <Globe className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <a href={specialist.website} target="_blank" className="text-sm text-teal-600 hover:underline font-medium truncate max-w-[200px]">
                                            {specialist.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact info info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Contact Information</h3>
                            <div className="space-y-3">
                                {specialist.phone && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-semibold">{specialist.phone}</p>
                                    </div>
                                )}
                                {specialist.email && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-semibold truncate max-w-[200px]">{specialist.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 mt-4">
                        {canEdit && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 px-5 rounded-xl border-teal-200 hover:bg-teal-50 text-teal-700 font-semibold"
                                onClick={() => setEditOpen(true)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit my card
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                onReferClick?.(specialist)
                                onOpenChange(false)
                            }}
                            className="flex-1 min-w-[140px] bg-teal-600 hover:bg-teal-700 h-12 text-base font-bold shadow-lg shadow-teal-600/20"
                        >
                            Refer New Patient
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 px-5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                            onClick={() => specialist.website && window.open(specialist.website, "_blank")}
                            disabled={!specialist.website}
                        >
                            <ExternalLink className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <EditSpecialistDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            specialist={specialist}
            specialties={specialties}
            onSuccess={handleEditSuccess}
        />
        </>
    )
}
