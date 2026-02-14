import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET /api/specialties - List all active specialties
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: specialties, error } = await supabase
            .from("specialties")
            .select("*")
            .eq("active", true)
            .order("name", { ascending: true })

        if (error) throw error

        return NextResponse.json(specialties || [])
    } catch (error) {
        console.error("[SPECIALTIES_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/specialties - Create new specialty (admin only)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()

        if (userData?.role !== 'clinic_admin' && userData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: "Missing specialty name" }, { status: 400 })
        }

        const { data: newSpecialty, error } = await supabase
            .from("specialties")
            .insert({ name, active: true })
            .select()
            .single()

        if (error) {
            console.error("[SPECIALTIES_POST_ERROR]", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(newSpecialty)
    } catch (error) {
        console.error("[SPECIALTIES_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
