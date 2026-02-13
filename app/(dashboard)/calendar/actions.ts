"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getClinicId } from "../patients/actions"

export async function saveAppointment(formData: FormData) {
    const supabase = await createClient()
    const clinicId = await getClinicId()

    const rawData = {
        patient_id: formData.get("patientId") as string,
        dentist_id: formData.get("dentistId") as string,
        treatment_type: formData.get("treatmentType") as string,
        start_time: formData.get("start") as string, // ISO String expected
        end_time: formData.get("end") as string, // ISO String expected
        status: "scheduled",
        clinic_id: clinicId
    }

    // Basic validation
    if (!rawData.patient_id || !rawData.start_time || !rawData.end_time) {
        throw new Error("Missing required fields")
    }

    const { error } = await supabase.from("appointments").insert(rawData)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/calendar")
    return { success: true }
}

export async function rescheduleAppointment(appointmentId: string, start: Date, end: Date) {
    const supabase = await createClient()
    const clinicId = await getClinicId()

    const { error } = await supabase
        .from("appointments")
        .update({
            start_time: start.toISOString(),
            end_time: end.toISOString()
        })
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/calendar")
    return { success: true }
}
