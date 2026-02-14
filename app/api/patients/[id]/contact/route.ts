
import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { phone, email, address } = body

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { error } = await supabase
            .from("patients")
            .update({
                phone,
                email,
                address
            })
            .eq("id", id)

        if (error) {
            console.error("[PATIENT_CONTACT_UPDATE]", error)
            return new NextResponse("Internal Error", { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PATIENT_CONTACT_UPDATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
