/**
 * Visit transition triggers (PatientVisitWorkflow 2.0).
 * Spec-driven: uses getNotificationTriggersForTransition when workflowTemplate is a preset.
 * Falls back to hardcoded transition keys for custom/legacy.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { getNotificationTriggersForTransition } from "@/lib/workflow-spec"
import { createNotification } from "@/lib/notifications"
import type { VisitState } from "@/lib/visit-state-machine"

export interface VisitTriggerContext {
  clinicId: string
  appointmentId: string
  appointment: { patient_id: string; room?: string | null; dentist_id?: string | null; treatment_type?: string | null }
  visit: { id: string; status: string; flags?: Record<string, unknown>; room?: string | null }
  patient?: { first_name?: string; last_name?: string; insurance_provider?: string | null } | null
  /** When set (default_clinic_workflow | full_clinic_workflow), triggers are driven by spec. */
  workflowTemplate?: string | null
}

/**
 * Run triggers for a transition. Best-effort; errors are logged but do not fail the transition.
 * When ctx.workflowTemplate is a preset, runs spec notification triggers; otherwise uses legacy switch.
 */
export async function runVisitTriggers(
  supabase: SupabaseClient,
  fromState: string,
  toState: string,
  ctx: VisitTriggerContext
): Promise<void> {
  const key = `${fromState} -> ${toState}`

  try {
    const template = ctx.workflowTemplate
    if (template === "default_clinic_workflow" || template === "full_clinic_workflow") {
      const triggers = getNotificationTriggersForTransition(
        template,
        fromState as VisitState,
        toState as VisitState
      )
      for (const trigger of triggers) {
        if (trigger === "notify_assigned_dentist") await notifyAssignedDentist(supabase, ctx)
        else if (trigger === "notify_front_desk") await notifyFrontDesk(supabase, ctx)
        else if (trigger === "notify_admin") await notifyAdmin(supabase, ctx, toState)
        else if (trigger === "notify_dentist") await notifyAssignedDentist(supabase, ctx)
      }
      if (key === "READY_FOR_BILLING -> BILLED") await onBilled(supabase, ctx)
      return
    }

    switch (key) {
      case "CHECKED_IN -> READY_FOR_EXAM":
        await notifyAssignedDentist(supabase, ctx)
        break
      case "READY_FOR_EXAM -> EXAM_IN_PROGRESS":
        break
      case "EXAM_IN_PROGRESS -> TREATMENT_PLANNED":
        break
      case "TREATMENT_PLANNED -> READY_FOR_BILLING":
        await notifyFrontDesk(supabase, ctx)
        break
      case "READY_FOR_BILLING -> BILLED":
        await onBilled(supabase, ctx)
        await notifyAdmin(supabase, ctx, "BILLED")
        break
      case "PAYMENT_COMPLETED -> VISIT_COMPLETED":
        await notifyAdmin(supabase, ctx, "VISIT_COMPLETED")
        break
      default:
        break
    }
  } catch (err) {
    console.error("[visit-triggers]", key, err)
  }
}

async function notifyAssignedDentist(supabase: SupabaseClient, ctx: VisitTriggerContext): Promise<void> {
  const dentistId = ctx.appointment.dentist_id
  if (!dentistId) return

  const patientName = ctx.patient
    ? [ctx.patient.first_name, ctx.patient.last_name].filter(Boolean).join(" ") || "Patient"
    : "Patient"
  const room = ctx.visit.room ?? ctx.appointment.room ?? "—"
  const message = `${patientName} is ready for exam in room ${room}.`

  await createNotification({
    supabase,
    clinicId: ctx.clinicId,
    userId: dentistId,
    type: "patient_ready_for_exam",
    title: "Patient ready for exam",
    message,
    link: `/calendar?appointmentId=${ctx.appointmentId}`,
    entityType: "visit",
    entityId: ctx.visit.id,
  })
}

async function notifyAdmin(
  supabase: SupabaseClient,
  ctx: VisitTriggerContext,
  newStatus: string
): Promise<void> {
  const patientName = ctx.patient
    ? [ctx.patient.first_name, ctx.patient.last_name].filter(Boolean).join(" ") || "Patient"
    : "Patient"
  const message = `Visit ${newStatus}: ${patientName}.`

  const { data: adminUsers } = await supabase
    .from("users")
    .select("id")
    .eq("clinic_id", ctx.clinicId)
    .in("role", ["super_admin", "clinic_admin"])

  const userIds = (adminUsers ?? []).map((u) => u.id)
  for (const userId of userIds) {
    await createNotification({
      supabase,
      clinicId: ctx.clinicId,
      userId,
      type: "visit_status_update",
      title: "Visit status update",
      message,
      link: `/calendar?appointmentId=${ctx.appointmentId}`,
      entityType: "visit",
      entityId: ctx.visit.id,
    })
  }
}

async function notifyFrontDesk(supabase: SupabaseClient, ctx: VisitTriggerContext): Promise<void> {
  const patientName = ctx.patient
    ? [ctx.patient.first_name, ctx.patient.last_name].filter(Boolean).join(" ") || "Patient"
    : "Patient"
  const message = `${patientName} — treatment planned, ready for billing.`

  const { data: frontDeskUsers } = await supabase
    .from("users")
    .select("id")
    .eq("clinic_id", ctx.clinicId)
    .in("role", ["receptionist", "accountant"])

  const userIds = (frontDeskUsers ?? []).map((u) => u.id)
  for (const userId of userIds) {
    await createNotification({
      supabase,
      clinicId: ctx.clinicId,
      userId,
      type: "patient_ready_for_billing",
      title: "Ready for billing",
      message,
      link: `/calendar?appointmentId=${ctx.appointmentId}`,
      entityType: "visit",
      entityId: ctx.visit.id,
    })
  }
}

async function onBilled(supabase: SupabaseClient, ctx: VisitTriggerContext): Promise<void> {
  // If invoice already exists for this appointment, skip creation
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("clinic_id", ctx.clinicId)
    .eq("appointment_id", ctx.appointmentId)
    .neq("status", "cancelled")
    .limit(1)
  if (existing && existing.length > 0) return

  const treatmentType = ctx.appointment.treatment_type || "Appointment"
  let unitPrice = 0
  const { data: treatments } = await supabase
    .from("treatments")
    .select("price")
    .eq("clinic_id", ctx.clinicId)
    .ilike("name", `%${treatmentType}%`)
    .limit(1)
  if (treatments?.[0]) unitPrice = Number((treatments[0] as { price?: number }).price ?? 0)

  const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`
  const { data: inserted, error: invError } = await supabase
    .from("invoices")
    .insert({
      clinic_id: ctx.clinicId,
      patient_id: ctx.appointment.patient_id,
      appointment_id: ctx.appointmentId,
      invoice_number: invoiceNumber,
      total_amount: unitPrice,
      status: "pending",
      due_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single()

  if (invError || !inserted?.id) {
    console.error("[visit-triggers] create invoice", invError)
    return
  }

  await supabase.from("invoice_items").insert({
    invoice_id: inserted.id,
    description: treatmentType,
    quantity: 1,
    unit_price: unitPrice,
  })
}
