import type { SupabaseClient } from "@supabase/supabase-js"

export type NotificationType =
    | "info"
    | "success"
    | "warning"
    | "error"
    | "time_off_requested"
    | "time_off_approved"
    | "time_off_rejected"
    | "time_off_granted"
    | "referral_received"
    | "referral_status_updated"
    | "referral_intake_submitted"
    | "appointment_assigned"
    | "appointment_cancelled"
    | "appointment_rescheduled"
    | "staff_invited"
    | "staff_joined"
    | "invoice_paid"
    | "invoice_overdue"
    | "new_message"

export interface CreateNotificationParams {
    supabase: SupabaseClient
    clinicId: string
    userId: string
    type: NotificationType
    title: string
    message?: string
    link?: string
    actorId?: string
    entityType?: string
    entityId?: string
}

/**
 * Create an in-app notification for one user. Call from API routes (e.g. after approving time off).
 * Uses the same Supabase client as the request (RLS: user must be in same clinic to insert).
 */
export async function createNotification(params: CreateNotificationParams): Promise<{ id?: string; error?: Error }> {
    const { supabase, clinicId, userId, type, title, message, link, actorId, entityType, entityId } = params
    const { data, error } = await supabase
        .from("notifications")
        .insert({
            clinic_id: clinicId,
            user_id: userId,
            type,
            title,
            message: message ?? null,
            link: link ?? null,
            actor_id: actorId ?? null,
            entity_type: entityType ?? null,
            entity_id: entityId ?? null,
        })
        .select("id")
        .single()
    if (error) {
        console.error("[createNotification]", error)
        return { error: error as unknown as Error }
    }
    return { id: data?.id }
}
