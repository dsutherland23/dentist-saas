import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { error } = await supabase
            .from("treatment_records")
            .delete()
            .eq("id", id)
            .eq("clinic_id", userData.clinic_id)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[TREATMENT_RECORD_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
