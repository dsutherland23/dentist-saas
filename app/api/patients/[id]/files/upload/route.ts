import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: patientId } = await params

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) return NextResponse.json({ error: "Clinic not found" }, { status: 404 })

        // Verify patient belongs to clinic
        const { data: patient, error: patientError } = await supabase
            .from("patients")
            .select("id")
            .eq("id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (patientError || !patient) {
            return NextResponse.json({ error: "Patient not found or access denied" }, { status: 404 })
        }

        const formData = await request.formData()
        const fileValue = formData.get("file")
        const name = (formData.get("name") as string) || (fileValue && typeof (fileValue as File).name === "string" ? (fileValue as File).name : null) || "Untitled"
        const type = (formData.get("type") as string) || "document"

        // Accept File or Blob (e.g. from camera capture or multipart parsing)
        const hasArrayBuffer = fileValue && typeof (fileValue as Blob).arrayBuffer === "function"
        const size = hasArrayBuffer ? (fileValue as Blob).size : 0
        if (!hasArrayBuffer || size === 0) {
            return NextResponse.json({ error: "No file provided or file is empty" }, { status: 400 })
        }

        if (size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: `File must be under ${MAX_FILE_SIZE_MB}MB` }, { status: 400 })
        }

        const buffer = Buffer.from(await (fileValue as Blob).arrayBuffer())
        const fileExt = (fileValue as File).name?.split(".").pop() || (type === "xray" || type === "intraoral" || type === "3d_scan" ? "jpg" : "bin")
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `${patientId}/${fileName}`

        const contentType = (fileValue as Blob).type || (fileExt === "jpg" || fileExt === "jpeg" ? "image/jpeg" : "application/octet-stream")
        const { error: uploadError } = await supabase.storage
            .from("patient-files")
            .upload(filePath, buffer, { upsert: false, contentType })

        if (uploadError) {
            console.error("[FILES_UPLOAD] Storage error:", uploadError)
            return NextResponse.json(
                { error: "Storage upload failed", details: uploadError.message },
                { status: 500 }
            )
        }

        const { data: record, error: insertError } = await supabase
            .from("patient_files")
            .insert({
                clinic_id: userData.clinic_id,
                patient_id: patientId,
                name,
                type,
                file_path: filePath,
                created_by: user.id,
            })
            .select()
            .single()

        if (insertError) {
            console.error("[FILES_UPLOAD] Insert error:", insertError)
            return NextResponse.json({
                error: "Failed to save file record",
                details: insertError.message,
                hint: insertError.code === "42P01" ? "Run scripts/fix-patient-files.sql in Supabase SQL Editor to create the patient_files table." : undefined
            }, { status: 500 })
        }

        return NextResponse.json(record)
    } catch (error) {
        console.error("[FILES_UPLOAD]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
