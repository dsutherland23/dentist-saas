"use client"

import React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getSpecialtyColor } from "@/lib/specialty-colors"

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
    const selectedSpecialty = value && value !== "all" ? specialties.find((s) => s.id === value) : null
    const selectedColor = selectedSpecialty ? getSpecialtyColor(selectedSpecialty.id, specialties) : null

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[220px] h-11 bg-white border-slate-300 focus:ring-teal-500">
                <div className="flex items-center gap-2">
                    {selectedColor && (
                        <span
                            className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: selectedColor }}
                            aria-hidden
                        />
                    )}
                    <SelectValue placeholder="All Specialties" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => {
                    const color = getSpecialtyColor(specialty.id, specialties)
                    return (
                        <SelectItem key={specialty.id} value={specialty.id}>
                            <span className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full border border-slate-200 shadow-sm"
                                    style={{ backgroundColor: color }}
                                    aria-hidden
                                />
                                {specialty.name}
                            </span>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}
