/**
 * Geocode a full address string to lat/lng using Nominatim.
 * Returns null if not found or request fails.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const trimmed = address.trim()
    if (!trimmed) return null
    try {
        const params = new URLSearchParams({
            q: trimmed,
            format: "json",
            limit: "1",
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: { "User-Agent": "DentistSaaS-SpecialistIntake/1.0" },
        })
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return null
        const first = data[0]
        const lat = parseFloat(first.lat)
        const lng = parseFloat(first.lon)
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null
        return { lat, lng }
    } catch {
        return null
    }
}
