import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const url = new URL(request.url)
        const path = url.searchParams.get("path")
        if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 })

        const { data, error } = await supabase.storage
            .from("patient-files")
            .createSignedUrl(path, 3600)

        if (error) {
            console.error("[FILE_URL]", error)
            return NextResponse.json({ error: "Failed to get file URL" }, { status: 500 })
        }
        return NextResponse.json({ url: data.signedUrl })
    } catch (err) {
        console.error("[FILE_URL]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
