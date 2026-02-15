"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight, Stethoscope } from "lucide-react"
import { SpecialistDetailsDialog } from "./specialist-details-dialog"
import { getSpecialtyColor } from "@/lib/specialty-colors"

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

interface SpecialistCardProps {
    specialist: Specialist
    onReferClick?: (specialist: Specialist) => void
    currentUserId?: string | null
    isAdmin?: boolean
    specialties?: Specialty[]
    onEditSuccess?: () => void
}

export function SpecialistCard({ specialist, onReferClick, currentUserId, isAdmin, specialties = [], onEditSuccess }: SpecialistCardProps) {
    const [detailsOpen, setDetailsOpen] = React.useState(false)

    const initials = specialist.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <>
            <Card
                className="p-3 hover:shadow-md transition-all duration-300 border-slate-100 rounded-xl cursor-pointer group hover:border-teal-100 hover:bg-teal-50/30"
                onClick={() => setDetailsOpen(true)}
            >
                <div className="flex items-center gap-3">
                    {/* Compact Avatar */}
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="bg-transparent text-white text-base font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                                {specialist.name}
                            </h3>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                            <span
                                className="text-xs font-semibold truncate flex items-center gap-1"
                                style={{ color: getSpecialtyColor(specialist.specialty?.id ?? "", specialties) }}
                            >
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: getSpecialtyColor(specialist.specialty?.id ?? "", specialties) }}
                                    aria-hidden
                                />
                                {specialist.specialty.name}
                            </span>
                            {specialist.city && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    {specialist.city}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <SpecialistDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                specialist={specialist}
                onReferClick={onReferClick}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                specialties={specialties}
                onEditSuccess={onEditSuccess}
            />
        </>
    )
}
