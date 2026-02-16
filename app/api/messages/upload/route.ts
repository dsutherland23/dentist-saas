import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

const BUCKET = "message-attachments"
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
        }

        const ext = (file.name.split(".").pop() || "").slice(0, 20)
        const safeName = file.name.slice(0, 100).replace(/[^a-zA-Z0-9._-]/g, "_")
        const path = `${userData.clinic_id}/${user.id}/${randomUUID()}_${safeName}`

        const buf = await file.arrayBuffer()
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, buf, { contentType: file.type, upsert: false })

        if (error) {
            console.error("[MESSAGES_UPLOAD]", error)
            return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const url = urlData?.publicUrl ?? ""

        return NextResponse.json({
            url,
            name: file.name,
            size: file.size,
        })
    } catch (error) {
        console.error("[MESSAGES_UPLOAD]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
