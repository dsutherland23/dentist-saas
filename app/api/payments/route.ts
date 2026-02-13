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

        const { data: payments, error } = await supabase
            .from("payments")
            .select(`
                *,
                invoice:invoices (
                    invoice_number,
                    patient:patients (
                        first_name,
                        last_name
                    )
                )
            `)
            .eq("clinic_id", userData.clinic_id)
            .order("payment_date", { ascending: false })

        if (error) throw error

        return NextResponse.json(payments)
    } catch (error) {
        console.error("[PAYMENTS_GET]", error)
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
        const { invoice_id, amount_paid, payment_method, status, transaction_id } = body

        if (!invoice_id || !amount_paid) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const { data: payment, error } = await supabase
            .from("payments")
            .insert({
                invoice_id,
                amount_paid,
                payment_method: payment_method || 'cash',
                status: status || 'succeeded',
                transaction_id,
                clinic_id: userData.clinic_id,
                payment_date: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        // Update invoice status to 'paid'
        await supabase
            .from("invoices")
            .update({ status: 'paid' })
            .eq("id", invoice_id)

        return NextResponse.json(payment)
    } catch (error) {
        console.error("[PAYMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
