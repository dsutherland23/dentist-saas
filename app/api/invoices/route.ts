import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
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

        const url = new URL(req.url)
        const invoiceId = url.searchParams.get("id")

        if (invoiceId) {
            const { data: invoice, error } = await supabase
                .from("invoices")
                .select(`
                    *,
                    patient:patients(*),
                    items:invoice_items(*),
                    clinic:clinics(*)
                `)
                .eq("id", invoiceId)
                .eq("clinic_id", userData.clinic_id)
                .single()

            if (error) throw error
            return NextResponse.json(invoice)
        }

        const { data: invoices, error } = await supabase
            .from("invoices")
            .select(`
                *,
                patient:patients(first_name, last_name, email),
                clinic:clinics(*)
            `)
            .eq("clinic_id", userData.clinic_id)
            .neq("status", "cancelled") // Hide cancelled/archived by default
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(invoices)
    } catch (error) {
        console.error("[INVOICES_GET]", error)
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
        const { patient_id, items, due_date } = body

        if (!patient_id || !items || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)
        const total_amount = subtotal

        const invoice_number = `INV-${Math.floor(100000 + Math.random() * 900000)}`

        const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id,
                invoice_number,
                total_amount,
                subtotal,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'sent'
            })
            .select()
            .single()

        if (invoiceError) throw invoiceError

        const invoiceItems = items.map((item: any) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price
        }))

        const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(invoiceItems)

        if (itemsError) throw itemsError

        return NextResponse.json(invoice)
    } catch (error) {
        console.error("[INVOICES_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { id, status } = body

        if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

        const { error } = await supabase
            .from("invoices")
            .update({ status })
            .eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[INVOICES_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
