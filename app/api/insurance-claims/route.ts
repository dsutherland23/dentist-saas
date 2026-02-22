import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()
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

        const { data: claims, error } = await supabase
            .from("claims")
            .select(`
                *,
                patient:patients(first_name, last_name, email),
                invoice:invoices(invoice_number, total_amount, status),
                policy:insurance_policies(provider_id, member_id, group_number, provider:insurance_providers(name))
            `)
            .eq("clinic_id", userData.clinic_id)
            .order("submitted_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(claims ?? [])
    } catch (error) {
        console.error("[CLAIMS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
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

        const body = await req.json()
        const {
            patient_id,
            invoice_id,
            policy_id,
            insurance_provider,
            policy_number,
            amount_claimed,
            total_amount,
            insurance_estimate,
            patient_responsibility,
        } = body

        if (!patient_id) {
            return NextResponse.json({ error: "Missing required field: patient_id" }, { status: 400 })
        }

        const amount = total_amount ?? amount_claimed ?? 0
        const claim_number = `CLM-${Math.floor(100000 + Math.random() * 900000)}`

        const { data: claim, error } = await supabase
            .from("claims")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id,
                policy_id: policy_id ?? null,
                invoice_id: invoice_id === "none" || !invoice_id ? null : invoice_id,
                claim_number,
                status: "pending",
                total_amount: Number(amount),
                insurance_estimate: insurance_estimate != null ? Number(insurance_estimate) : null,
                patient_responsibility: patient_responsibility != null ? Number(patient_responsibility) : null,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(claim)
    } catch (error) {
        console.error("[CLAIMS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
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

        const body = await req.json()
        const { id, status, notes } = body

        if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 })

        const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
        if (notes !== undefined) updates.notes = notes

        const { data: claim, error } = await supabase
            .from("claims")
            .update(updates)
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(claim)
    } catch (error) {
        console.error("[CLAIMS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })

        const { error } = await supabase
            .from("claims")
            .delete()
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[CLAIMS_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
