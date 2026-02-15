"use client"

import React from "react"
import { SpecialistCard } from "./specialist-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

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
    user_id?: string | null
}

interface Specialty {
    id: string
    name: string
}

interface SpecialistListProps {
    specialists: Specialist[]
    loading?: boolean
    onReferClick?: (specialist: Specialist) => void
    currentUserId?: string | null
    isAdmin?: boolean
    specialties?: Specialty[]
    onEditSuccess?: () => void
}

export function SpecialistList({ specialists, loading, onReferClick, currentUserId, isAdmin, specialties = [], onEditSuccess }: SpecialistListProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (specialists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <p className="text-slate-600 text-lg font-medium">No specialists found</p>
                <p className="text-slate-500 text-sm mt-2">
                    Try adjusting your search or filters
                </p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-2 p-1">
                {specialists.map((specialist) => (
                    <SpecialistCard
                        key={specialist.id}
                        specialist={specialist}
                        onReferClick={onReferClick}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        specialties={specialties}
                        onEditSuccess={onEditSuccess}
                    />
                ))}
            </div>
        </ScrollArea>
    )
}
