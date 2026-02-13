import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const body = await request.json()
    const { insurance_provider, insurance_policy_number } = body

    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from("patients")
            .update({ insurance_provider, insurance_policy_number })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error updating insurance:", error)
        return NextResponse.json(
            { error: "Failed to update insurance" },
            { status: 500 }
        )
    }
}
