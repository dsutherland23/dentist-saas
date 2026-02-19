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

        // Ensure patient exists and belongs to user's clinic
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()
        const { data: patient } = await supabase
            .from("patients")
            .select("id")
            .eq("id", id)
            .eq("clinic_id", userData?.clinic_id ?? "")
            .single()
        if (!patient) {
            return NextResponse.json({ error: "Patient not found or access denied" }, { status: 404 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 })
        }

        const fileExt = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "")
        const pathWithinBucket = `${id}/profile-${Date.now()}.${fileExt || "jpg"}`

        const { error: uploadError } = await supabase.storage
            .from("patient-files")
            .upload(pathWithinBucket, file, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json(
                { error: "Upload failed", details: uploadError.message },
                { status: 500 }
            )
        }

        const { data: { publicUrl } } = supabase.storage
            .from("patient-files")
            .getPublicUrl(pathWithinBucket)

        const { data: updated, error: updateError } = await supabase
            .from("patients")
            .update({ profile_picture_url: publicUrl })
            .eq("id", id)
            .select("id")
            .single()

        if (updateError) {
            console.error("Database update error:", updateError)
            const isNoRows = /0 rows|no rows|PGRST116/i.test(updateError.message)
            const details = isNoRows
                ? "Update had no effect. You may not have permission to update this patient."
                : updateError.message
            return NextResponse.json(
                { error: "Failed to save profile picture", details },
                { status: 500 }
            )
        }
        if (!updated) {
            return NextResponse.json(
                { error: "Failed to save profile picture", details: "Update had no effect." },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, url: publicUrl })
    } catch (error) {
        console.error("[PROFILE_PICTURE_UPLOAD]", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
