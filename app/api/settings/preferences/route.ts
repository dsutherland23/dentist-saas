import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET user preferences
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get or create preferences
        let { data: prefs, error } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (error && error.code === 'PGRST116') {
            // No preferences found, create default
            const { data: newPrefs, error: insertError } = await supabase
                .from("user_preferences")
                .insert({ user_id: user.id })
                .select()
                .single()

            if (insertError) {
                return NextResponse.json({ error: "Failed to create preferences" }, { status: 500 })
            }

            prefs = newPrefs
        } else if (error) {
            return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
        }

        return NextResponse.json(prefs)

    } catch (error) {
        console.error("Preferences GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT update user preferences
export async function PUT(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

        // Update preferences
        const { data, error } = await supabase
            .from("user_preferences")
            .update({
                email_notifications: body.email_notifications,
                sms_notifications: body.sms_notifications,
                appointment_reminders: body.appointment_reminders,
                marketing_emails: body.marketing_emails,
                timezone: body.timezone,
                language: body.language
            })
            .eq("user_id", user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error("Preferences PUT error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
