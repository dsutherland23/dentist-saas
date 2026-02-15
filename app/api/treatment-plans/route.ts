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

        const { searchParams } = new URL(req.url)
        const planId = searchParams.get("id")

        const clinicId = userData.clinic_id

        // If specific plan requested
        if (planId) {
            const { data: plan, error } = await supabase
                .from("treatment_plans")
                .select(`
                    *,
                    patient:patients(id, first_name, last_name, email, phone),
                    dentist:users!dentist_id(id, first_name, last_name),
                    items:treatment_plan_items(
                        *,
                        treatment:treatments(id, name, category, price),
                        appointment:appointments(id, start_time, status),
                        invoice:invoices(id, invoice_number, status)
                    )
                `)
                .eq("id", planId)
                .eq("clinic_id", clinicId)
                .single()

            if (error) throw error
            return NextResponse.json(plan)
        }

        // Get all plans with items
        const { data: plans, error } = await supabase
            .from("treatment_plans")
            .select(`
                *,
                patient:patients(id, first_name, last_name, email),
                dentist:users!dentist_id(id, first_name, last_name),
                items:treatment_plan_items(
                    id,
                    description,
                    total_price,
                    status,
                    appointment_id
                )
            `)
            .eq("clinic_id", clinicId)
            .order("created_at", { ascending: false })

        if (error) throw error

        // Enhance plans with calculated metrics
        const enrichedPlans = (plans || []).map(plan => {
            const items = plan.items || []
            const unscheduledItems = items.filter((item: any) => 
                !item.appointment_id && item.status === 'not_started'
            )
            const unscheduledValue = unscheduledItems.reduce(
                (sum: number, item: any) => sum + parseFloat(item.total_price || 0),
                0
            )

            return {
                ...plan,
                patient_name: plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name}` : 'Unknown',
                dentist_name: plan.dentist ? `${plan.dentist.first_name} ${plan.dentist.last_name}` : 'Unassigned',
                unscheduled_value: unscheduledValue,
                unscheduled_count: unscheduledItems.length,
                total_items: items.length
            }
        })

        return NextResponse.json(enrichedPlans)

    } catch (error) {
        console.error("[TREATMENT_PLANS_GET]", error)
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
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "Clinic Not Found" }, { status: 404 })
        }

        // Check permissions
        if (!['clinic_admin', 'dentist', 'hygienist'].includes(userData.role)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const body = await req.json()
        const { patient_id, plan_name, dentist_id, notes, items } = body

        if (!patient_id || !plan_name || !items || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Calculate total estimated cost
        const totalCost = items.reduce((sum: number, item: any) => 
            sum + parseFloat(item.total_price || 0), 0
        )

        // Create treatment plan
        const { data: plan, error: planError } = await supabase
            .from("treatment_plans")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id,
                dentist_id: dentist_id || user.id,
                plan_name,
                total_estimated_cost: totalCost,
                notes,
                status: 'proposed'
            })
            .select()
            .single()

        if (planError) throw planError

        // Create treatment plan items
        const itemsToInsert = items.map((item: any) => ({
            treatment_plan_id: plan.id,
            treatment_id: item.treatment_id,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            notes: item.notes
        }))

        const { error: itemsError } = await supabase
            .from("treatment_plan_items")
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        return NextResponse.json(plan)

    } catch (error) {
        console.error("[TREATMENT_PLANS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
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
        const { id, status, notes } = body

        if (!id) {
            return NextResponse.json({ error: "Missing plan ID" }, { status: 400 })
        }

        const updateData: any = { updated_at: new Date().toISOString() }
        if (status) updateData.status = status
        if (notes !== undefined) updateData.notes = notes

        const { data: plan, error } = await supabase
            .from("treatment_plans")
            .update(updateData)
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(plan)

    } catch (error) {
        console.error("[TREATMENT_PLANS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
