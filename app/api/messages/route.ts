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

        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:users!messages_sender_id_fkey(first_name, last_name, role),
                receiver:users!messages_receiver_id_fkey(first_name, last_name, role)
            `)
            .eq("clinic_id", userData.clinic_id)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(messages)
    } catch (error) {
        console.error("[MESSAGES_GET]", error)
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

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return new NextResponse("Clinic Not Found", { status: 404 })
        }

        const body = await req.json()
        const { receiver_id, content } = body

        if (!receiver_id || !content) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id,
                content,
                clinic_id: userData.clinic_id,
                created_at: new Date().toISOString()
            })
            .select(`
                *,
                sender:users!messages_sender_id_fkey(first_name, last_name, role),
                receiver:users!messages_receiver_id_fkey(first_name, last_name, role)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(message)
    } catch (error) {
        console.error("[MESSAGES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
