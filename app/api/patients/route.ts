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

        const { data: patients, error } = await supabase
            .from("patients")
            .select("*")
            .eq("clinic_id", userData.clinic_id)
            .order("last_name", { ascending: true })

        if (error) throw error

        return NextResponse.json(patients)
    } catch (error) {
        console.error("[PATIENTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
