"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getClinicId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .single()

    if (!userData?.clinic_id) {
        throw new Error("User has no associated clinic.")
    }

    return userData.clinic_id
}

export async function savePatient(formData: FormData) {
    const supabase = await createClient()
    const clinicId = await getClinicId()

    const rawData = {
        first_name: formData.get("firstName") as string,
        last_name: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        date_of_birth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string).toISOString() : null,
        status: "Active", // Default status, schema doesn't have status on patients table actually?
        clinic_id: clinicId
    }

    // Schema check: The schema `patients` table has fields:
    // first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, ...

    // It does NOT have `status` or `balance` directly on `patients`. Those were in the mock data!
    // Balance is calculated from invoices. Status is likely inferred or added.
    // For now, I will ignore `status` and `balance` in the insert.

    const { error } = await supabase.from("patients").insert({
        first_name: rawData.first_name,
        last_name: rawData.last_name,
        email: rawData.email,
        phone: rawData.phone,
        date_of_birth: rawData.date_of_birth,
        clinic_id: clinicId
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/patients")
    return { success: true }
}

export async function deletePatient(patientId: string) {
    const supabase = await createClient()

    // RLS ensures only clinic's patients can be deleted
    const { error } = await supabase.from("patients").delete().eq("id", patientId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/patients")
    return { success: true }
}
