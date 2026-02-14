import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const clinicId = formData.get('clinicId') as string

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const supabase = await createClient()

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify permissions
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id || (userData.role !== 'clinic_admin' && userData.role !== 'super_admin')) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${clinicId || userData.clinic_id || 'clinic'}-logo.${fileExt}`
        const filePath = `${fileName}`

        // Upload file
        // Note: We are using the user's session. The RLS policy must allow authenticated users to INSERT/UPDATE to 'clinic-assets'.
        const { error: uploadError } = await supabase.storage
            .from('clinic-assets')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error("Supabase storage upload error:", uploadError)
            return NextResponse.json({ error: "Storage upload failed", details: uploadError.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('clinic-assets')
            .getPublicUrl(filePath)

        return NextResponse.json({ publicUrl })

    } catch (error: any) {
        console.error("Logo upload API error:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}
