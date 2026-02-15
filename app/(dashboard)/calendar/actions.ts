"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getClinicId } from "../patients/actions"
import { checkLimit } from "@/lib/limit-enforcement"

export async function saveAppointment(formData: FormData) {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Unauthorized")
    }

    // Check appointments_per_month limit
    const limitCheck = await checkLimit(user.id, "appointments_per_month", 1)
    if (!limitCheck.allowed) {
        throw new Error(limitCheck.message || "Monthly appointment limit reached")
    }

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
    const missing: string[] = []
    if (!rawData.patient_id?.trim()) missing.push("patient")
    if (!rawData.start_time?.trim()) missing.push("start time")
    if (!rawData.end_time?.trim()) missing.push("end time")
    if (missing.length) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`)
    }

    const startDate = new Date(rawData.start_time)
    if (isNaN(startDate.getTime()) || startDate.getTime() < Date.now()) {
        throw new Error("Appointments cannot be scheduled in the past")
    }

    const endDate = new Date(rawData.end_time)

    const { data: conflictingBlocks } = await supabase
        .from("blocked_slots")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("staff_id", rawData.dentist_id)
        .lt("start_time", rawData.end_time)
        .gt("end_time", rawData.start_time)

    if (conflictingBlocks?.length) {
        throw new Error("This time slot is blocked for the selected dentist")
    }

    const { error } = await supabase.from("appointments").insert(rawData)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/calendar")
    revalidatePath(`/patients/${rawData.patient_id}`)
    return { success: true }
}

export async function rescheduleAppointment(appointmentId: string, start: Date, end: Date) {
    if (start.getTime() < Date.now()) {
        throw new Error("Appointments cannot be rescheduled to the past")
    }

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
