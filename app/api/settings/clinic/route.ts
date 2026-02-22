import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET clinic settings
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's clinic
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        // Get clinic details
        const { data: clinic, error } = await supabase
            .from("clinics")
            .select("*")
            .eq("id", userData.clinic_id)
            .single()

        if (error) {
            return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 })
        }

        return NextResponse.json(clinic)

    } catch (error) {
        console.error("Clinic GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT update clinic settings
export async function PUT(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's clinic and role
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        // Only clinic_admin can update clinic settings
        if (userData.role !== 'clinic_admin' && userData.role !== 'super_admin') {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const body = await request.json()
        console.log("Updating clinic settings for clinic_id:", userData.clinic_id)
        console.log("Payload:", body)

        const updatePayload: Record<string, unknown> = {
            name: body.name,
            logo_url: body.logo_url,
            primary_color: body.primary_color,
            secondary_color: body.secondary_color,
            custom_domain: body.custom_domain,
            email: body.email,
            phone: body.phone,
            website: body.website,
            address: body.address,
            city: body.city,
            state: body.state,
            zip: body.zip,
            business_hours: body.business_hours,
        }
        if (typeof body.require_consent_in_visit_flow === "boolean") {
            updatePayload.require_consent_in_visit_flow = body.require_consent_in_visit_flow
        }
        if (typeof body.use_fullscreen === "boolean") {
            updatePayload.use_fullscreen = body.use_fullscreen
        }
        if (body.active_workflow_id !== undefined) {
            updatePayload.active_workflow_id = body.active_workflow_id === null ? null : body.active_workflow_id
        }
        if (body.workflow_template === "default_clinic_workflow" || body.workflow_template === "full_clinic_workflow") {
            updatePayload.workflow_template = body.workflow_template
        }
        Object.keys(updatePayload).forEach((k) => {
            if (updatePayload[k] === undefined) delete updatePayload[k]
        })

        const { data, error } = await supabase
            .from("clinics")
            .update(updatePayload)
            .eq("id", userData.clinic_id)
            .select()
            .single()

        if (error) {
            const isColumnMissing = error.message?.includes("column") && error.message?.includes("does not exist")
            if (isColumnMissing && updatePayload.use_fullscreen !== undefined) {
                const payloadWithoutFullscreen = { ...updatePayload }
                delete (payloadWithoutFullscreen as Record<string, unknown>).use_fullscreen
                const { data: retryData, error: retryError } = await supabase
                    .from("clinics")
                    .update(payloadWithoutFullscreen)
                    .eq("id", userData.clinic_id)
                    .select()
                    .single()
                if (!retryError) {
                    return NextResponse.json({
                        success: true,
                        data: retryData,
                        warning: "Other settings saved. To enable Fullscreen mode, run the database migration: 20260230000001_clinic_use_fullscreen.sql (adds use_fullscreen column to clinics table)."
                    })
                }
            }
            console.error("Supabase clinic update error:", error)
            const hint = isColumnMissing
                ? (error.message?.includes("use_fullscreen")
                    ? "To enable Fullscreen mode, run migration: 20260230000001_clinic_use_fullscreen.sql"
                    : "Database may need an update. Run the migration that adds the missing column.")
                : undefined
            return NextResponse.json({
                error: hint || "Failed to update clinic",
                details: error.message,
                code: error.code
            }, { status: 500 })
        }

        console.log("Clinic updated successfully")
        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error("Clinic PUT error:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}
