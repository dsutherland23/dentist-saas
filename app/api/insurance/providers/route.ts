import { createClient } from "@/lib/supabase-server"
import { canCreateEditInsurance } from "@/lib/insurance-permissions"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()
        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        const { data: providers, error } = await supabase
            .from("insurance_providers")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .order("name")

        if (error) throw error
        return NextResponse.json(providers ?? [])
    } catch (error) {
        console.error("[INSURANCE_PROVIDERS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
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
        const { name, payer_id, supports_electronic_claims, supports_era, eligibility_endpoint } = body
        if (!name) return NextResponse.json({ error: "Missing required field: name" }, { status: 400 })

        const { data: provider, error } = await supabase
            .from("insurance_providers")
            .insert({
                clinic_id: userData.clinic_id,
                name,
                payer_id: payer_id ?? null,
                supports_electronic_claims: supports_electronic_claims ?? true,
                supports_era: supports_era ?? false,
                eligibility_endpoint: eligibility_endpoint ?? null,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(provider)
    } catch (error) {
        console.error("[INSURANCE_PROVIDERS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
