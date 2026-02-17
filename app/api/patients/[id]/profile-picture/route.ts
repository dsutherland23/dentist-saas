import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 })
        }

        // Create unique filename
        const fileExt = file.name.split(".").pop()
        const fileName = `${id}/profile-${Date.now()}.${fileExt}`
        const filePath = `patient-files/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("patient-files")
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("patient-files")
            .getPublicUrl(filePath)

        // Update patient profile_picture_url
        const { error: updateError } = await supabase
            .from("patients")
            .update({ profile_picture_url: publicUrl })
            .eq("id", id)

        if (updateError) {
            console.error("Database update error:", updateError)
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            url: publicUrl 
        })
    } catch (error) {
        console.error("[PROFILE_PICTURE_UPLOAD]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
