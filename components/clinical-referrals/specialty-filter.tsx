"use client"

import React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Specialty {
    id: string
    name: string
}

interface SpecialtyFilterProps {
    specialties: Specialty[]
    value: string
    onChange: (value: string) => void
}

export function SpecialtyFilter({ specialties, value, onChange }: SpecialtyFilterProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[220px] h-11 bg-white border-slate-300 focus:ring-teal-500">
                <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
