"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SpecialistSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SpecialistSearch({ value, onChange, placeholder = "Search for specialist or location..." }: SpecialistSearchProps) {
    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-300 focus-visible:ring-teal-500"
            />
        </div>
    )
}
