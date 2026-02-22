import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { canCreateEditInsurance } from "@/lib/insurance-permissions"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; policyId: string }> }
) {
    const { id: patientId, policyId } = await params
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
        if (body.provider_id !== undefined) updates.provider_id = body.provider_id
        if (body.member_id !== undefined) updates.member_id = body.member_id
        if (body.group_number !== undefined) updates.group_number = body.group_number
        if (body.subscriber_name !== undefined) updates.subscriber_name = body.subscriber_name
        if (body.relationship !== undefined) updates.relationship = body.relationship
        if (body.plan_type !== undefined) updates.plan_type = body.plan_type
        updates.updated_at = new Date().toISOString()

        const { data: policy, error } = await supabase
            .from("insurance_policies")
            .update(updates)
            .eq("id", policyId)
            .eq("patient_id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error
        if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(policy)
    } catch (error) {
        console.error("[PATIENT_POLICY_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; policyId: string }> }
) {
    const { id: patientId, policyId } = await params
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
            .from("insurance_policies")
            .delete()
            .eq("id", policyId)
            .eq("patient_id", patientId)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[PATIENT_POLICY_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
