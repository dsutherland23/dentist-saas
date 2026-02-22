
import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json().catch(() => ({}))
        const { phone, email, address, gender, date_of_birth } = body as {
            phone?: string
            email?: string
            address?: string
            gender?: string | null
            date_of_birth?: string | null
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const updates: { phone?: string; email?: string; address?: string; gender?: string | null; date_of_birth?: string | null } = {}
        if (typeof phone === "string") updates.phone = phone
        if (typeof email === "string") updates.email = email
        if (typeof address === "string") updates.address = address
        if (gender !== undefined) {
            updates.gender = gender === null || gender === "" ? null : String(gender).trim().slice(0, 50)
        }
        if (date_of_birth !== undefined) {
            if (date_of_birth === null || date_of_birth === "") {
                updates.date_of_birth = null
            } else if (typeof date_of_birth === "string") {
                const d = new Date(date_of_birth)
                if (Number.isNaN(d.getTime())) {
                    return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 })
                }
                updates.date_of_birth = date_of_birth.trim()
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 })
        }

        const { error } = await supabase
            .from("patients")
            .update(updates)
            .eq("id", id)

        if (error) {
            console.error("[PATIENT_CONTACT_UPDATE]", error)
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PATIENT_CONTACT_UPDATE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
