"use client"

import React from "react"
import { getSpecialtyColor } from "@/lib/specialty-colors"

interface Specialty {
    id: string
    name: string
}

interface SpecialtyLegendProps {
    specialties: Specialty[]
    className?: string
}

/** Compact legend showing specialty name and its map color for quick reference */
export function SpecialtyLegend({ specialties, className = "" }: SpecialtyLegendProps) {
    if (specialties.length === 0) return null

    return (
        <div className={className}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Map colors by specialty
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {specialties.map((s) => {
                    const color = getSpecialtyColor(s.id, specialties)
                    return (
                        <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600"
                        >
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200 shadow-sm"
                                style={{ backgroundColor: color }}
                                aria-hidden
                            />
                            {s.name}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}
