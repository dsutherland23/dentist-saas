import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { geocodeAddress } from "@/lib/geocode"
import { checkRateLimit } from "@/lib/rate-limit"
import { sanitizeIntakeBody } from "@/lib/sanitize"

function getClientIp(request: Request): string {
    const xff = request.headers.get("x-forwarded-for")
    if (xff) return xff.split(",")[0].trim()
    const xri = request.headers.get("x-real-ip")
    if (xri) return xri.trim()
    return "unknown"
}

// GET /api/specialist-intake?token=... — Validate token, return context for form (no auth)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get("token")
        if (!token || token.length < 32) {
            return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { data: referral, error: refError } = await supabase
            .from("referrals")
            .select(`
                id,
                intake_token_expires_at,
                intake_submitted_at,
                patient_first_name,
                patient_last_name,
                specialist:specialists(id, name)
            `)
            .eq("intake_token", token)
            .single()

        if (refError || !referral) {
            return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
        }

        const expiresAt = referral.intake_token_expires_at ? new Date(referral.intake_token_expires_at).getTime() : 0
        if (Date.now() > expiresAt) {
            return NextResponse.json({ error: "This link has expired" }, { status: 410 })
        }

        if (referral.intake_submitted_at) {
            return NextResponse.json({ error: "This form has already been submitted" }, { status: 410 })
        }

        const { data: specialties } = await supabase
            .from("specialties")
            .select("id, name")
            .eq("active", true)
            .order("name")

        return NextResponse.json({
            referral_id: referral.id,
            patient_name: `${referral.patient_first_name || ""} ${referral.patient_last_name || ""}`.trim(),
            specialist_name: (referral.specialist as { name?: string } | null)?.name ?? "",
            specialties: specialties || [],
        })
    } catch (err) {
        console.error("[SPECIALIST_INTAKE_GET]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/specialist-intake — Submit intake form (token in body or header)
export async function POST(request: Request) {
    const ip = getClientIp(request)
    const rate = checkRateLimit(ip)
    if (!rate.allowed) {
        return NextResponse.json(
            { error: "Too many submissions. Please try again later.", retry_after: rate.retryAfter },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const token = (body?.token ?? request.headers.get("x-intake-token")) as string | undefined
        if (!token || token.length < 32) {
            return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 })
        }

        const sanitized = sanitizeIntakeBody(body)
        if ("error" in sanitized) {
            return NextResponse.json({ error: sanitized.error }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { data: referral, error: refError } = await supabase
            .from("referrals")
            .select("id, specialist_id, intake_token_expires_at, intake_submitted_at")
            .eq("intake_token", token)
            .single()

        if (refError || !referral) {
            return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
        }

        const expiresAt = referral.intake_token_expires_at ? new Date(referral.intake_token_expires_at).getTime() : 0
        if (Date.now() > expiresAt) {
            return NextResponse.json({ error: "This link has expired" }, { status: 410 })
        }

        if (referral.intake_submitted_at) {
            return NextResponse.json({ error: "This form has already been submitted" }, { status: 410 })
        }

        const fullAddress = [
            sanitized.address_line_1,
            sanitized.address_line_2,
            sanitized.parish_city,
            sanitized.country,
        ]
            .filter(Boolean)
            .join(", ")

        let lat: number | null = null
        let lng: number | null = null

        if (
            sanitized.lat != null &&
            sanitized.lng != null &&
            sanitized.gps_accuracy != null &&
            sanitized.gps_accuracy < 30
        ) {
            lat = sanitized.lat
            lng = sanitized.lng
        } else {
            const geocoded = await geocodeAddress(fullAddress)
            if (geocoded) {
                lat = geocoded.lat
                lng = geocoded.lng
            }
        }

        const addressCombined = sanitized.address_line_2
            ? `${sanitized.address_line_1}\n${sanitized.address_line_2}`
            : sanitized.address_line_1

        const { error: updateSpecError } = await supabase
            .from("specialists")
            .update({
                name: sanitized.full_name,
                clinic_name: sanitized.practice_name,
                specialty_id: sanitized.specialty_id,
                address: addressCombined,
                address_line_2: sanitized.address_line_2 || null,
                city: sanitized.parish_city,
                parish: sanitized.parish_city,
                country: sanitized.country,
                phone: sanitized.phone,
                email: sanitized.email,
                ...(lat != null && lng != null && { lat, lng }),
                updated_at: new Date().toISOString(),
            })
            .eq("id", referral.specialist_id)

        if (updateSpecError) {
            console.error("[SPECIALIST_INTAKE_UPDATE_SPEC]", updateSpecError)
            return NextResponse.json({ error: "Failed to save your details" }, { status: 500 })
        }

        const { error: updateRefError } = await supabase
            .from("referrals")
            .update({
                status: "location_confirmed",
                location_confirmed: true,
                intake_submitted_at: new Date().toISOString(),
                intake_submission_ip: ip === "unknown" ? null : ip,
                updated_at: new Date().toISOString(),
            })
            .eq("id", referral.id)

        if (updateRefError) {
            console.error("[SPECIALIST_INTAKE_UPDATE_REF]", updateRefError)
            return NextResponse.json({ error: "Failed to confirm location" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Thank you. Your details have been saved." })
    } catch (err) {
        console.error("[SPECIALIST_INTAKE_POST]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
