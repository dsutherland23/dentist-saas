/**
 * Consistent color coding for specialties across the Clinical Referrals map and dropdown.
 * Each specialty gets a unique color by its index in the sorted specialty list.
 */

/** Large palette of distinct colors so every specialty category gets its own color */
const SPECIALTY_PALETTE = [
    "#0ea5e9", // sky
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
    "#ef4444", // red
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#f97316", // orange
    "#a855f7", // purple
    "#06b6d4", // cyan
    "#eab308", // yellow
    "#84cc16", // lime
    "#64748b", // slate
    "#dc2626", // red-600
    "#2563eb", // blue-600
    "#059669", // emerald-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#d97706", // amber-600
    "#0891b2", // cyan-600
    "#65a30d", // lime-600
    "#4f46e5", // indigo-600
    "#ea580c", // orange-600
    "#be185d", // pink-700
    "#0369a1", // sky-700
    "#6d28d9", // violet-700
]

/** Simple string hash for fallback when specialty list is not provided */
function hashString(str: string): number {
    let h = 0
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i)
        h = (h << 5) - h + c
        h |= 0
    }
    return Math.abs(h)
}

/**
 * Returns a consistent hex color for a specialty.
 * When allSpecialties is provided, each specialty gets a unique color by its index in the sorted list.
 * When not provided, falls back to hash-based color (may collide).
 */
export function getSpecialtyColor(
    specialtyId: string,
    allSpecialties?: { id: string }[]
): string {
    if (!specialtyId) return SPECIALTY_PALETTE[0]

    if (allSpecialties && allSpecialties.length > 0) {
        const sorted = [...allSpecialties].sort((a, b) => a.id.localeCompare(b.id))
        const index = sorted.findIndex((s) => s.id === specialtyId)
        if (index >= 0) {
            return SPECIALTY_PALETTE[index % SPECIALTY_PALETTE.length]
        }
    }

    const index = hashString(specialtyId) % SPECIALTY_PALETTE.length
    return SPECIALTY_PALETTE[index]
}

export const SPECIALTY_PALETTE_SIZE = SPECIALTY_PALETTE.length
