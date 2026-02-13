import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return new NextResponse("Clinic Not Found", { status: 404 })
        }

        const { data: claims, error } = await supabase
            .from("insurance_claims")
            .select(`
                *,
                patient:patients(first_name, last_name, email),
                invoice:invoices(invoice_number, total_amount, status)
            `)
            .eq("clinic_id", userData.clinic_id)
            .order("submitted_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(claims)
    } catch (error) {
        console.error("[CLAIMS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return new NextResponse("Clinic Not Found", { status: 404 })
        }

        const body = await req.json()
        const { patient_id, invoice_id, insurance_provider, policy_number, amount_claimed } = body

        if (!patient_id || !insurance_provider || !amount_claimed) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const claim_number = `CLM-${Math.floor(100000 + Math.random() * 900000)}`

        const { data: claim, error } = await supabase
            .from("insurance_claims")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id,
                invoice_id: invoice_id === "none" ? null : invoice_id,
                claim_number,
                insurance_provider,
                policy_number,
                amount_claimed,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(claim)
    } catch (error) {
        console.error("[CLAIMS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) return new NextResponse("Clinic Not Found", { status: 404 })

        const body = await req.json()
        const { id, status, notes } = body

        if (!id || !status) return new NextResponse("Missing fields", { status: 400 })

        const { data: claim, error } = await supabase
            .from("insurance_claims")
            .update({ status, notes, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(claim)
    } catch (error) {
        console.error("[CLAIMS_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) return new NextResponse("Missing ID", { status: 400 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) return new NextResponse("Clinic Not Found", { status: 404 })

        const { error } = await supabase
            .from("insurance_claims")
            .delete()
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[CLAIMS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
