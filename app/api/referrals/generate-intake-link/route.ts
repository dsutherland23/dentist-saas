import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

/**
 * POST /api/referrals/generate-intake-link
 * Creates a minimal specialist + referral and returns an intake link (no patient/referral form).
 * Uses admin client so inserts succeed regardless of RLS (any authenticated user can send a link).
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name, email, clinic_id, clinics(name)")
            .eq("id", user.id)
            .single()

        let admin
        try {
            admin = createAdminClient()
        } catch (e) {
            const msg = !process.env.SUPABASE_SERVICE_ROLE_KEY
                ? "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in .env.local from Supabase Dashboard → Project Settings → API → service_role (secret). Required for sending referral links."
                : "Server configuration error: NEXT_PUBLIC_SUPABASE_URL is not set. Check .env.local."
            console.error("[GENERATE_INTAKE_LINK]", msg)
            return NextResponse.json({ error: msg }, { status: 500 })
        }

        const { data: firstSpecialty, error: specListError } = await admin
            .from("specialties")
            .select("id")
            .eq("active", true)
            .limit(1)
            .single()

        if (specListError || !firstSpecialty) {
            console.error("[GENERATE_INTAKE_LINK_SPECIALTIES]", specListError)
            return NextResponse.json({ error: "No specialty configured" }, { status: 500 })
        }

        const { data: newSpecialist, error: specError } = await admin
            .from("specialists")
            .insert({
                user_id: null,
                name: "Pending",
                specialty_id: firstSpecialty.id,
                status: "pending",
                country: "Jamaica",
            })
            .select("id")
            .single()

        if (specError) {
            console.error("[GENERATE_INTAKE_LINK_SPEC]", specError)
            return NextResponse.json({ error: "Failed to create intake" }, { status: 500 })
        }

        const clinicName = userData?.clinics && typeof userData.clinics === "object" && "name" in userData.clinics
            ? (userData.clinics as { name: string }).name
            : ""

        const intakeToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        const intakeTokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

        const { error: refError } = await admin
            .from("referrals")
            .insert({
                specialist_id: newSpecialist.id,
                referring_user_id: user.id,
                referring_provider_name: `${userData?.first_name ?? ""} ${userData?.last_name ?? ""}`.trim(),
                referring_organization: clinicName,
                referring_contact: userData?.email ?? "",
                patient_first_name: "Pending",
                patient_last_name: "—",
                reason: "Intake link sent",
                consent_confirmed: true,
                status: "sent",
                intake_token: intakeToken,
                intake_token_expires_at: intakeTokenExpiresAt,
            })

        if (refError) {
            console.error("[GENERATE_INTAKE_LINK_REF]", refError)
            return NextResponse.json({ error: "Failed to create intake link" }, { status: 500 })
        }

        const baseFromHeaders =
            request.headers.get("x-forwarded-proto") && request.headers.get("host")
                ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
                : ""
        const baseFromUrl = request.url ? (() => {
            try {
                const u = new URL(request.url)
                return `${u.protocol}//${u.host}`
            } catch {
                return ""
            }
        })() : ""
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || baseFromHeaders || baseFromUrl).replace(/\/$/, "")
        const intakeLink = baseUrl ? `${baseUrl}/specialist-intake?token=${intakeToken}` : ""

        return NextResponse.json({ intake_link: intakeLink })
    } catch (error) {
        console.error("[GENERATE_INTAKE_LINK]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
