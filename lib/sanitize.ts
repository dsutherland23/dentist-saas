/**
 * Sanitize and validate form inputs for specialist intake.
 * Prevents XSS and enforces safe bounds on coordinates.
 */

const MAX_TEXT = 500
const MAX_EMAIL = 255
const MAX_PHONE = 50
const MAX_NAME = 255
const LAT_MIN = -90
const LAT_MAX = 90
const LNG_MIN = -180
const LNG_MAX = 180

function strip(str: unknown): string {
    if (str == null || typeof str !== "string") return ""
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, MAX_TEXT)
}

export function sanitizeIntakeBody(body: unknown): {
    full_name: string
    practice_name: string
    specialty_id: string
    address_line_1: string
    address_line_2: string
    parish_city: string
    country: string
    phone: string
    email: string
    lat?: number
    lng?: number
    gps_accuracy?: number
} | { error: string } {
    if (!body || typeof body !== "object") {
        return { error: "Invalid request body" }
    }
    const b = body as Record<string, unknown>

    const full_name = strip(b.full_name).slice(0, MAX_NAME)
    const practice_name = strip(b.practice_name).slice(0, MAX_NAME)
    const specialty_id = typeof b.specialty_id === "string" ? b.specialty_id.trim().slice(0, 64) : ""
    const address_line_1 = strip(b.address_line_1)
    const address_line_2 = strip(b.address_line_2).slice(0, 255)
    const parish_city = strip(b.parish_city).slice(0, 100)
    const country = strip(b.country).slice(0, 100) || "Jamaica"
    const phone = strip(b.phone).slice(0, MAX_PHONE)
    const email = strip(b.email).slice(0, MAX_EMAIL).toLowerCase()

    if (!full_name) return { error: "Full name is required" }
    if (!practice_name) return { error: "Practice name is required" }
    if (!specialty_id) return { error: "Specialty is required" }
    if (!address_line_1) return { error: "Address line 1 is required" }
    if (!parish_city) return { error: "Parish/City is required" }
    if (!phone) return { error: "Phone is required" }
    if (!email) return { error: "Email is required" }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return { error: "Invalid email format" }

    let lat: number | undefined
    let lng: number | undefined
    let gps_accuracy: number | undefined
    if (typeof b.lat === "number" && !Number.isNaN(b.lat) && b.lat >= LAT_MIN && b.lat <= LAT_MAX) {
        lat = b.lat
    }
    if (typeof b.lng === "number" && !Number.isNaN(b.lng) && b.lng >= LNG_MIN && b.lng <= LNG_MAX) {
        lng = b.lng
    }
    if (typeof b.gps_accuracy === "number" && !Number.isNaN(b.gps_accuracy) && b.gps_accuracy >= 0) {
        gps_accuracy = b.gps_accuracy
    }

    return {
        full_name,
        practice_name,
        specialty_id,
        address_line_1,
        address_line_2,
        parish_city,
        country,
        phone,
        email,
        ...(lat != null && lng != null && { lat, lng, gps_accuracy }),
    }
}
