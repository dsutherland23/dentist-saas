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

        const { data: treatments, error } = await supabase
            .from("treatments")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .order("name", { ascending: true })

        if (error) throw error

        return NextResponse.json(treatments)
    } catch (error) {
        console.error("[TREATMENTS_GET]", error)
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

        const body = await req.json()
        const { name, category, duration_minutes, price, description } = body

        if (!name || !price) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id || !['super_admin', 'clinic_admin', 'dentist'].includes(userData.role)) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { data: treatment, error } = await supabase
            .from("treatments")
            .insert({
                clinic_id: userData.clinic_id,
                name,
                category,
                duration_minutes,
                price,
                description,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(treatment)
    } catch (error) {
        console.error("[TREATMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { id, ...updates } = body

        if (!id) return new NextResponse("Missing ID", { status: 400 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id || !['super_admin', 'clinic_admin', 'dentist'].includes(userData.role)) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { data: treatment, error } = await supabase
            .from("treatments")
            .update(updates)
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(treatment)
    } catch (error) {
        console.error("[TREATMENTS_PATCH]", error)
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
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id || !['super_admin', 'clinic_admin'].includes(userData.role)) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { error } = await supabase
            .from("treatments")
            .delete()
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[TREATMENTS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
