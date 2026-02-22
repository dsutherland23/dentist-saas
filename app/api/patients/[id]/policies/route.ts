import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { canCreateEditInsurance } from "@/lib/insurance-permissions"

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: patientId } = await params
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

        const { data: patient } = await supabase
            .from("patients")
            .select("id, clinic_id")
            .eq("id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .single()
        if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

        const { data: policies, error } = await supabase
            .from("insurance_policies")
            .select(`
                *,
                provider:insurance_providers(id, name, payer_id)
            `)
            .eq("patient_id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json(policies ?? [])
    } catch (error) {
        console.error("[PATIENT_POLICIES_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: patientId } = await params
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

        const { data: patient } = await supabase
            .from("patients")
            .select("id, clinic_id")
            .eq("id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .single()
        if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

        const body = await req.json()
        const {
            provider_id,
            member_id,
            group_number,
            subscriber_name,
            relationship,
            plan_type,
        } = body

        const { data: policy, error } = await supabase
            .from("insurance_policies")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id: patientId,
                provider_id: provider_id ?? null,
                member_id: member_id ?? null,
                group_number: group_number ?? null,
                subscriber_name: subscriber_name ?? null,
                relationship: relationship ?? null,
                plan_type: plan_type ?? null,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(policy)
    } catch (error) {
        console.error("[PATIENT_POLICIES_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
