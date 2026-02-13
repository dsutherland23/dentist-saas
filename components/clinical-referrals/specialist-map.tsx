"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import LeafletMap to avoid SSR errors
const LeafletMap = dynamic(
    () => import("./leaflet-map"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                    <p className="text-slate-500 font-medium">Initializing Free Map...</p>
                </div>
            </div>
        )
    }
)

interface Specialist {
    id: string
    name: string
    specialty: { name: string; id: string }
    clinic_name?: string
    lat: number
    lng: number
    phone?: string
    email?: string
    website?: string
}

interface SpecialistMapProps {
    specialists: Specialist[]
    onReferClick?: (specialist: Specialist) => void
    className?: string
    searchQuery?: string
}

const defaultCenter: [number, number] = [18.1096, -77.2975] // Jamaica

export function SpecialistMap({ specialists, onReferClick, className, searchQuery }: SpecialistMapProps) {
    // Calculate center based on specialists if available
    const center: [number, number] = specialists.length > 0
        ? [
            specialists.reduce((sum, s) => sum + Number(s.lat), 0) / specialists.length,
            specialists.reduce((sum, s) => sum + Number(s.lng), 0) / specialists.length,
        ]
        : defaultCenter

    return (
        <div className={className}>
            <LeafletMap
                specialists={specialists}
                onReferClick={onReferClick}
                center={center}
                zoom={specialists.length > 0 ? 12 : 9}
                searchQuery={searchQuery}
            />
        </div>
    )
}
