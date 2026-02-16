import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const VALID_ACCEPTANCE_STATUSES = ["pending", "accepted", "declined"]

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })
        }

        const body = await req.json().catch(() => ({}))
        const { acceptance_status } = body

        if (!acceptance_status || !VALID_ACCEPTANCE_STATUSES.includes(acceptance_status)) {
            return NextResponse.json(
                { error: "Valid acceptance_status required: pending, accepted, declined" },
                { status: 400 }
            )
        }

        const { data: item } = await supabase
            .from("treatment_plan_items")
            .select("id, treatment_plan_id")
            .eq("id", id)
            .single()

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        const { data: plan } = await supabase
            .from("treatment_plans")
            .select("id, clinic_id")
            .eq("id", item.treatment_plan_id)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (!plan) {
            return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 })
        }

        const { data: updated, error } = await supabase
            .from("treatment_plan_items")
            .update({ acceptance_status })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(updated)
    } catch (error) {
        console.error("[TREATMENT_PLAN_ITEM_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
