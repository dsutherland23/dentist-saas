import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/users/me — Update the current user's profile (first_name, last_name).
 * Any authenticated user can update their own name. Role and email are not changeable here.
 */
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { first_name, last_name } = body

        const updates: { first_name?: string; last_name?: string } = {}
        if (typeof first_name === "string") {
            const trimmed = first_name.trim()
            if (trimmed.length > 100) {
                return NextResponse.json({ error: "First name must be 100 characters or less" }, { status: 400 })
            }
            updates.first_name = trimmed || undefined
        }
        if (typeof last_name === "string") {
            const trimmed = last_name.trim()
            if (trimmed.length > 100) {
                return NextResponse.json({ error: "Last name must be 100 characters or less" }, { status: 400 })
            }
            updates.last_name = trimmed || undefined
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update. Send first_name and/or last_name." }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", user.id)
            .select("id, first_name, last_name, email, role")
            .single()

        if (error) {
            console.error("[users/me PATCH]", error)
            return NextResponse.json(
                { error: error.message || "Failed to update profile" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (error) {
        console.error("[users/me PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
