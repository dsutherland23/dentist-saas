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

        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:users!sender_id(first_name, last_name, role),
                receiver:users!receiver_id(first_name, last_name, role)
            `)
            .eq("clinic_id", userData.clinic_id)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(messages ?? [])
    } catch (error) {
        console.error("[MESSAGES_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/** Mark messages as read (messages where current user is receiver) */
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { message_ids } = body

        if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
            return NextResponse.json({ error: "Missing message_ids array" }, { status: 400 })
        }

        const { error } = await supabase
            .from("messages")
            .update({ is_read: true })
            .in("id", message_ids)
            .eq("receiver_id", user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[MESSAGES_PATCH]", error)
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
        const { receiver_id, content, attachments } = body

        if (!receiver_id) {
            return NextResponse.json({ error: "Missing receiver_id" }, { status: 400 })
        }

        const trimmedContent = typeof content === "string" ? content.trim() : ""
        const attachmentList = Array.isArray(attachments)
            ? attachments.filter((a: any) => a && typeof a.url === "string" && a.url)
            : []

        if (!trimmedContent && attachmentList.length === 0) {
            return NextResponse.json({ error: "Message must have text or at least one attachment" }, { status: 400 })
        }

        // Ensure receiver is in the same clinic (and not a patient)
        const { data: receiver } = await supabase
            .from("users")
            .select("id, clinic_id, role")
            .eq("id", receiver_id)
            .single()

        if (!receiver || receiver.clinic_id !== userData.clinic_id) {
            return NextResponse.json({ error: "Receiver not found or not in your clinic" }, { status: 404 })
        }
        if (receiver.role === "patient") {
            return NextResponse.json({ error: "Cannot message patients via this channel" }, { status: 400 })
        }

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id,
                message: trimmedContent || " ",
                clinic_id: userData.clinic_id,
                attachments: attachmentList.length > 0 ? attachmentList : undefined,
            })
            .select(`
                *,
                sender:users!sender_id(first_name, last_name, role),
                receiver:users!receiver_id(first_name, last_name, role)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(message)
    } catch (error) {
        console.error("[MESSAGES_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
