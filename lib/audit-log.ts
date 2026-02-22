/**
 * Helper to write audit_logs for insurance and other sensitive actions.
 * Uses existing audit_logs table (clinic_id, user_id, action, record_type, record_id, ip_address).
 */

import { SupabaseClient } from "@supabase/supabase-js"

export type AuditPayload = {
    clinic_id: string
    user_id: string | null
    action: string
    record_type?: string
    record_id?: string
    ip_address?: string
    before_value?: string | null
    after_value?: string | null
}

export async function insertAuditLog(
    supabase: SupabaseClient,
    payload: AuditPayload
): Promise<void> {
    await supabase.from("audit_logs").insert({
        clinic_id: payload.clinic_id,
        user_id: payload.user_id,
        action: payload.action,
        record_type: payload.record_type ?? null,
        record_id: payload.record_id ?? null,
        ip_address: payload.ip_address ?? null,
        before_value: payload.before_value ?? null,
        after_value: payload.after_value ?? null,
    })
}

export type VisitStatusChangeAuditParams = {
    clinic_id: string
    user_id: string | null
    record_id: string
    before: string
    after: string
    ip_address?: string
}

/** Log visit status change with before/after values (spec audit_log.track_fields). */
export async function insertVisitStatusChangeAudit(
    supabase: SupabaseClient,
    params: VisitStatusChangeAuditParams
): Promise<void> {
    await insertAuditLog(supabase, {
        clinic_id: params.clinic_id,
        user_id: params.user_id,
        action: `visit_status_change: ${params.before} -> ${params.after}`,
        record_type: "visit",
        record_id: params.record_id,
        ip_address: params.ip_address,
        before_value: params.before,
        after_value: params.after,
    })
}

/** Get client IP from Next.js request headers */
export function getClientIp(request: Request): string | undefined {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0]?.trim()
    return request.headers.get("x-real-ip") ?? undefined
}
