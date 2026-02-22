import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { canCreateEditInsurance } from "@/lib/insurance-permissions"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()
        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        if (!canCreateEditInsurance(userData.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const updates: Record<string, unknown> = {}
        if (body.name !== undefined) updates.name = body.name
        if (body.payer_id !== undefined) updates.payer_id = body.payer_id
        if (body.supports_electronic_claims !== undefined) updates.supports_electronic_claims = body.supports_electronic_claims
        if (body.supports_era !== undefined) updates.supports_era = body.supports_era
        if (body.eligibility_endpoint !== undefined) updates.eligibility_endpoint = body.eligibility_endpoint

        const { data: provider, error } = await supabase
            .from("insurance_providers")
            .update(updates)
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error
        if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(provider)
    } catch (error) {
        console.error("[INSURANCE_PROVIDERS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()
        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        if (!canCreateEditInsurance(userData.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { error } = await supabase
            .from("insurance_providers")
            .delete()
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[INSURANCE_PROVIDERS_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
