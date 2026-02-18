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

        const { data: patients, error } = await supabase
            .from("patients")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .order("last_name", { ascending: true })

        if (error) throw error

        return NextResponse.json(patients)
    } catch (error) {
        console.error("[PATIENTS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Minimal patient create for quick walk-in registration
export async function POST(request: Request) {
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

        const body = await request.json().catch(() => ({}))
        const { first_name, last_name, phone, email } = body as {
            first_name?: string
            last_name?: string
            phone?: string
            email?: string
        }

        if (!first_name || !last_name) {
            return NextResponse.json(
                { error: "first_name and last_name are required" },
                { status: 400 }
            )
        }

        const { data: patient, error } = await supabase
            .from("patients")
            .insert({
                clinic_id: userData.clinic_id,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                phone: phone?.trim() || null,
                email: email?.trim() || null,
            })
            .select("*")
            .single()

        if (error) {
            console.error("[PATIENTS_POST]", error)
            return NextResponse.json(
                { error: error.message || "Failed to create patient" },
                { status: 500 }
            )
        }

        return NextResponse.json(patient, { status: 201 })
    } catch (error) {
        console.error("[PATIENTS_POST_FATAL]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
