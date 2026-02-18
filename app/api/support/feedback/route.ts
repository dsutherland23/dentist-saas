import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

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
            return NextResponse.json({ error: "No clinic found" }, { status: 404 })
        }

        const body = await request.json()
        const content = typeof body?.content === "string" ? body.content.trim() : ""
        if (!content) {
            return NextResponse.json({ error: "Please enter your suggestion or feedback." }, { status: 400 })
        }

        const { error } = await supabase
            .from("support_feedback")
            .insert({
                clinic_id: userData.clinic_id,
                user_id: user.id,
                content,
            })

        if (error) {
            console.error("[Support feedback] insert error:", error)
            return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Support feedback error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
