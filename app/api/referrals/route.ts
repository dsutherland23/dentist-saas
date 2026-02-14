import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET /api/referrals - List referrals (filtered by user role)
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const type = searchParams.get("type") // "sent" or "received"

        // Check if user is a specialist
        const { data: userSpecialist } = await supabase
            .from("specialists")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "approved")
            .single()

        let query = supabase
            .from("referrals")
            .select(`
                *,
                specialist:specialists(id, name, clinic_name, specialty:specialties(name)),
                referring_user:users!referring_user_id(first_name, last_name, email)
            `)

        // Filter based on type or user role
        if (type === "sent" || !userSpecialist) {
            // Show referrals sent by this user
            query = query.eq("referring_user_id", user.id)
        } else if (type === "received" && userSpecialist) {
            // Show referrals received by this specialist
            query = query.eq("specialist_id", userSpecialist.id)
        } else if (userSpecialist) {
            // If no type specified and user is a specialist, show received
            query = query.eq("specialist_id", userSpecialist.id)
        } else {
            // Default to sent referrals
            query = query.eq("referring_user_id", user.id)
        }

        if (status) {
            query = query.eq("status", status)
        }

        query = query.order("created_at", { ascending: false })

        const { data: referrals, error } = await query

        if (error) throw error

        return NextResponse.json(referrals || [])
    } catch (error) {
        console.error("[REFERRALS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/referrals - Create new referral
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user details for referring provider info
        const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name, email, clinic_id, clinics(name)")
            .eq("id", user.id)
            .single()

        const body = await request.json()
        const {
            specialist_id,
            patient_first_name,
            patient_last_name,
            dob,
            urgency,
            reason,
            attachments,
            consent_confirmed
        } = body

        // Validate required fields
        if (!specialist_id || !patient_first_name || !patient_last_name || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (!consent_confirmed) {
            return NextResponse.json({ error: "Patient consent required" }, { status: 400 })
        }

        // Extract clinic name safely
        const clinicName = userData?.clinics && typeof userData.clinics === 'object' && 'name' in userData.clinics
            ? (userData.clinics as { name: string }).name
            : ""

        const intakeToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        const intakeTokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

        const { data: newReferral, error } = await supabase
            .from("referrals")
            .insert({
                specialist_id,
                referring_user_id: user.id,
                referring_provider_name: `${userData?.first_name} ${userData?.last_name}`,
                referring_organization: clinicName,
                referring_contact: userData?.email || "",
                patient_first_name,
                patient_last_name,
                dob,
                urgency: urgency || "routine",
                reason,
                attachments: attachments || null,
                consent_confirmed,
                status: "sent",
                intake_token: intakeToken,
                intake_token_expires_at: intakeTokenExpiresAt,
            })
            .select(`
                *,
                specialist:specialists(id, name, email, clinic_name),
                referring_user:users!referring_user_id(first_name, last_name, email)
            `)
            .single()

        if (error) {
            console.error("[REFERRALS_POST_ERROR]", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get("x-forwarded-proto") && request.headers.get("host") ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}` : "")
        const intakeLink = baseUrl ? `${baseUrl.replace(/\/$/, "")}/specialist-intake?token=${intakeToken}` : ""

        return NextResponse.json({ ...newReferral, intake_link: intakeLink, intake_token: intakeToken })
    } catch (error) {
        console.error("[REFERRALS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PATCH /api/referrals - Update referral status
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ error: "Missing referral ID or status" }, { status: 400 })
        }

        // Verify user is authorized to update this referral
        const { data: referral } = await supabase
            .from("referrals")
            .select("specialist_id, referring_user_id")
            .eq("id", id)
            .single()

        if (!referral) {
            return NextResponse.json({ error: "Referral not found" }, { status: 404 })
        }

        // Check if user is the specialist for this referral
        const { data: userSpecialist } = await supabase
            .from("specialists")
            .select("id")
            .eq("user_id", user.id)
            .eq("id", referral.specialist_id)
            .single()

        // Only the specialist or referring user can update
        const canUpdate = userSpecialist || referral.referring_user_id === user.id

        if (!canUpdate) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: updatedReferral, error } = await supabase
            .from("referrals")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select(`
                *,
                specialist:specialists(id, name, clinic_name),
                referring_user:users!referring_user_id(first_name, last_name, email)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(updatedReferral)
    } catch (error) {
        console.error("[REFERRALS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
