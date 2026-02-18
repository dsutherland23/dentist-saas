import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

const VALID_STATUSES = ["pending", "unconfirmed", "scheduled", "confirmed", "checked_in", "in_treatment", "completed", "cancelled", "no_show"]

/**
 * PATCH appointment status. Use for scheduling states (scheduled, confirmed, cancelled, no_show).
 * In-clinic flow (checked_in → in_treatment → completed) is also enforced by the Visit Flow Engine:
 * POST /api/visits/transition with state machine, role checks, and step requirements.
 * Calendar shows Visit Progress Panel when a visit exists; legacy buttons still call this PATCH when no visit.
 */
export async function PATCH(
    request: Request,
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
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const body = await request.json().catch(() => ({}))
        const { status } = body as { status?: string }

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Valid status required: " + VALID_STATUSES.join(", ") },
                { status: 400 }
            )
        }

        // Only update status - timestamps are set by DB trigger if columns exist
        const { data, error } = await supabase
            .from("appointments")
            .update({ status })
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select(`
                *,
                patients(first_name, last_name, date_of_birth),
                dentists:users(first_name, last_name)
            `)
            .single()

        if (error) {
            console.error("[APPOINTMENTS_PATCH] Supabase error:", error.message, error.code)
            const isConstraintViolation = error.code === "23514" || error.message?.includes("check constraint")
            return NextResponse.json(
                {
                    error: isConstraintViolation
                        ? "Status not allowed. Run migrations or scripts/fix-appointment-status-constraint.sql to add pending/unconfirmed."
                        : error.message,
                },
                { status: 400 }
            )
        }

        revalidatePath("/calendar")
        revalidatePath("/patients")
        if (data?.patient_id) revalidatePath(`/patients/${data.patient_id}`)

        // For check-in: compute queue number for receipt
        let queueNumber: number | undefined
        if (status === "checked_in" && data?.checked_in_at) {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)
            const { count } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("clinic_id", userData.clinic_id)
                .in("status", ["checked_in", "in_treatment", "completed"])
                .not("checked_in_at", "is", null)
                .gte("start_time", todayStart.toISOString())
                .lte("start_time", todayEnd.toISOString())
                .lte("checked_in_at", data.checked_in_at)
            queueNumber = count ?? 0
        }

        return NextResponse.json({ ...data, queueNumber })
    } catch (error) {
        console.error("[APPOINTMENTS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
