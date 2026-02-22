import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import {
  canTransition,
  STATE_TIMESTAMP_KEYS,
  type VisitState,
} from "@/lib/visit-state-machine"
import { insertVisitStatusChangeAudit, getClientIp } from "@/lib/audit-log"
import {
  getRequiredValidationsForTransition,
  getRequiredFlagsForSpecExpressions,
} from "@/lib/workflow-spec"
import {
  getAllowedTransitionsForTemplate,
  getAllowedTransitionsFromCustomConfig,
  type WorkflowTemplateConfig,
} from "@/lib/workflow-templates"
import { runVisitTriggers } from "@/lib/visit-triggers"

interface TransitionBody {
  appointmentId: string
  nextState: string
  flags?: Record<string, boolean>
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userWithRole = await supabase
      .from("users")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    if (!userWithRole.data?.clinic_id) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 })
    }

    const clinicId = userWithRole.data.clinic_id
    const userRole = userWithRole.data.role ?? null

    const body = (await request.json().catch(() => ({}))) as TransitionBody
    const { appointmentId, nextState, flags: bodyFlags } = body

    if (!appointmentId || !nextState) {
      return NextResponse.json(
        { error: "appointmentId and nextState required" },
        { status: 400 }
      )
    }

    // Load appointment
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .select("id, clinic_id, patient_id, room, dentist_id, status, treatment_type")
      .eq("id", appointmentId)
      .eq("clinic_id", clinicId)
      .single()

    if (apptError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Load existing visit (if any)
    let { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId)
      .maybeSingle()

    if (visitError) {
      console.error("[VISITS_TRANSITION] fetch visit", visitError)
      return NextResponse.json({ error: "Failed to load visit" }, { status: 500 })
    }

    const now = new Date().toISOString()

    // No visit yet: only allow CHECKED_IN to create the visit (Workflow v2)
    if (!visit) {
      if (nextState !== "CHECKED_IN") {
        return NextResponse.json(
          { error: "Start visit by checking in the patient first" },
          { status: 400 }
        )
      }

      const newTimestamps: Record<string, string> = {
        checkedIn: now,
      }
      const newFlags = bodyFlags ?? {}

      const { data: inserted, error: insertError } = await supabase
        .from("visits")
        .insert({
          appointment_id: appointmentId,
          clinic_id: clinicId,
          status: "CHECKED_IN",
          timestamps: newTimestamps,
          flags: newFlags,
          room: appointment.room ?? null,
          dentist_id: appointment.dentist_id ?? null,
          assistant_id: null,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[VISITS_TRANSITION] insert visit", insertError)
        return NextResponse.json({ error: "Failed to create visit" }, { status: 500 })
      }

      await insertVisitStatusChangeAudit(supabase, {
        clinic_id: clinicId,
        user_id: user.id,
        record_id: inserted.id,
        before: "(new)",
        after: "CHECKED_IN",
        ip_address: getClientIp(request),
      })

      return NextResponse.json({
        visit: {
          visitId: inserted.id,
          appointmentId: inserted.appointment_id,
          clinicId: inserted.clinic_id,
          status: inserted.status,
          timestamps: inserted.timestamps ?? {},
          flags: inserted.flags ?? {},
          room: inserted.room ?? null,
          dentistId: inserted.dentist_id ?? null,
          assistantId: inserted.assistant_id ?? null,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        },
        appointment: null,
      })
    }

    // Merge incoming flags before validation
    let mergedFlags = { ...(visit.flags ?? {}), ...(bodyFlags ?? {}) }

    const { data: clinicRow } = await supabase
      .from("clinics")
      .select("require_consent_in_visit_flow, workflow_template, active_workflow_id")
      .eq("id", clinicId)
      .single()

    const workflowTemplate = clinicRow?.workflow_template ?? null
    let customWorkflowConfig: WorkflowTemplateConfig | null = null
    if (clinicRow?.active_workflow_id) {
      const { data: customTemplate } = await supabase
        .from("workflow_templates")
        .select("config")
        .eq("id", clinicRow.active_workflow_id)
        .eq("clinic_id", clinicId)
        .single()
      if (customTemplate?.config) customWorkflowConfig = customTemplate.config as WorkflowTemplateConfig
    }
    if (clinicRow?.require_consent_in_visit_flow === false) {
      mergedFlags = { ...mergedFlags, consentSigned: true }
    }
    if (nextState === "EXAM_IN_PROGRESS") {
      mergedFlags = { ...mergedFlags, examStarted: true }
    }
    if (nextState === "TREATMENT_PLANNED") {
      mergedFlags = { ...mergedFlags, billingUnlocked: true }
    }

    const result = canTransition(
      visit.status,
      nextState,
      { flags: mergedFlags, room: visit.room ?? appointment.room ?? null },
      userRole
    )

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason ?? "Transition not allowed" },
        { status: 400 }
      )
    }

    // Template gate: custom template allows only next node in list; preset default restricts to linear
    if (customWorkflowConfig) {
      const allowedForTemplate = getAllowedTransitionsFromCustomConfig(
        customWorkflowConfig,
        visit.status as VisitState
      )
      if (!allowedForTemplate.includes(nextState as VisitState)) {
        return NextResponse.json(
          { error: "This transition is not allowed for the clinic's workflow template" },
          { status: 400 }
        )
      }
    } else if (workflowTemplate === "default_clinic_workflow") {
      const allowedForTemplate = getAllowedTransitionsForTemplate(
        visit.status as VisitState,
        workflowTemplate
      )
      if (!allowedForTemplate.includes(nextState as VisitState)) {
        return NextResponse.json(
          { error: "This transition is not allowed for the clinic's workflow template" },
          { status: 400 }
        )
      }
    } else if (workflowTemplate === "full_clinic_workflow") {
      const allowedForTemplate = getAllowedTransitionsForTemplate(
        visit.status as VisitState,
        workflowTemplate
      )
      if (!allowedForTemplate.includes(nextState as VisitState)) {
        return NextResponse.json(
          { error: "This transition is not allowed for the clinic's workflow template" },
          { status: 400 }
        )
      }
    }

    // Spec-based validation for preset templates: required flags and special checks
    if (
      !customWorkflowConfig &&
      (workflowTemplate === "default_clinic_workflow" || workflowTemplate === "full_clinic_workflow")
    ) {
      const expressions = getRequiredValidationsForTransition(
        workflowTemplate,
        visit.status as VisitState,
        nextState as VisitState
      )
      const { flags: requiredFlags, needsInvoice, needsPayment } =
        getRequiredFlagsForSpecExpressions(expressions)
      const room = visit.room ?? appointment.room ?? null
      for (const flag of requiredFlags) {
        if (flag === "roomAssigned") {
          if (!room?.trim()) {
            return NextResponse.json(
              { error: "Missing required field: roomAssigned (room must be set)" },
              { status: 400 }
            )
          }
        } else if (!mergedFlags[flag]) {
          return NextResponse.json(
            { error: `Missing required field: ${flag}` },
            { status: 400 }
          )
        }
      }
      if (needsInvoice && nextState === "BILLED") {
        const { data: inv } = await supabase
          .from("invoices")
          .select("id")
          .eq("clinic_id", clinicId)
          .eq("appointment_id", appointmentId)
          .neq("status", "cancelled")
          .limit(1)
        if (!inv?.length) {
          return NextResponse.json(
            {
              error:
                "An invoice is required before marking as Billed. Create or link an invoice for this appointment.",
            },
            { status: 400 }
          )
        }
      }
      if (needsPayment && nextState === "PAYMENT_COMPLETED") {
        // Handled below in BILLED -> PAYMENT_COMPLETED block
      }
    }

    // BILLED -> PAYMENT_COMPLETED: require payment_amount_received >= invoice_total
    if (visit.status === "BILLED" && nextState === "PAYMENT_COMPLETED") {
      let { data: invoiceList } = await supabase
        .from("invoices")
        .select("id, total_amount, appointment_id")
        .eq("clinic_id", clinicId)
        .eq("appointment_id", appointmentId)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
      let invoice = Array.isArray(invoiceList) ? invoiceList[0] : invoiceList

      // If no invoice linked to this appointment, use the patient's single unpaid invoice and link it
      if (!invoice?.id) {
        const { data: patientInvoices } = await supabase
          .from("invoices")
          .select("id, total_amount, appointment_id")
          .eq("clinic_id", clinicId)
          .eq("patient_id", appointment.patient_id)
          .in("status", ["sent", "draft"])
          .or("appointment_id.is.null,appointment_id.eq." + appointmentId)
          .order("created_at", { ascending: false })
        const list = Array.isArray(patientInvoices) ? patientInvoices : patientInvoices ? [patientInvoices] : []
        if (list.length === 0) {
          return NextResponse.json(
            {
              error:
                "No invoice found for this appointment. Create an invoice for this patient (e.g. from their profile), then complete payment here—or link an existing invoice to this visit.",
            },
            { status: 400 }
          )
        }
        if (list.length > 1) {
          return NextResponse.json(
            {
              error:
                "Multiple unpaid invoices for this patient. Link one invoice to this visit from the patient’s Invoices tab, or use the invoice that is already linked to this appointment.",
            },
            { status: 400 }
          )
        }
        invoice = list[0]
        // Link this invoice to the appointment so future lookups work
        if (invoice.appointment_id !== appointmentId) {
          await supabase
            .from("invoices")
            .update({ appointment_id: appointmentId })
            .eq("id", invoice.id)
            .eq("clinic_id", clinicId)
        }
      }

      if (invoice?.id) {
        const { data: payments } = await supabase
          .from("payments")
          .select("amount_paid")
          .eq("invoice_id", invoice.id)

        const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0)
        const invoiceTotal = Number(invoice.total_amount ?? 0)
        if (totalPaid < invoiceTotal) {
          return NextResponse.json(
            { error: `Payment required: ${totalPaid} received, ${invoiceTotal} due` },
            { status: 400 }
          )
        }
      }
    }

    const stateKey = STATE_TIMESTAMP_KEYS[nextState as VisitState]
    const updatedTimestamps = {
      ...(visit.timestamps ?? {}),
      ...(stateKey ? { [stateKey]: now } : {}),
    }

    const { data: updated, error: updateError } = await supabase
      .from("visits")
      .update({
        status: nextState,
        timestamps: updatedTimestamps,
        flags: mergedFlags,
        updated_at: now,
      })
      .eq("id", visit.id)
      .eq("clinic_id", clinicId)
      .select()
      .single()

    if (updateError) {
      console.error("[VISITS_TRANSITION] update visit", updateError)
      return NextResponse.json({ error: "Failed to update visit" }, { status: 500 })
    }

    await insertVisitStatusChangeAudit(supabase, {
      clinic_id: clinicId,
      user_id: user.id,
      record_id: updated.id,
      before: visit.status,
      after: nextState,
      ip_address: getClientIp(request),
    })

    const { data: patient } = await supabase
      .from("patients")
      .select("first_name, last_name, insurance_provider")
      .eq("id", appointment.patient_id)
      .single()

    await runVisitTriggers(supabase, visit.status, nextState, {
      clinicId,
      appointmentId,
      appointment: {
        patient_id: appointment.patient_id,
        room: appointment.room,
        dentist_id: appointment.dentist_id,
        treatment_type: appointment.treatment_type,
      },
      visit: {
        id: updated.id,
        status: updated.status,
        flags: updated.flags ?? undefined,
        room: updated.room ?? undefined,
      },
      patient: patient ?? undefined,
      workflowTemplate: customWorkflowConfig ? null : workflowTemplate,
    })

    let appointmentUpdate: { status?: string; checked_out_at?: string } | null = null

    if (nextState === "VISIT_COMPLETED" || nextState === "CANCELLED") {
      const apptStatus = nextState === "VISIT_COMPLETED" ? "completed" : "cancelled"
      const { error: apptUpdateError } = await supabase
        .from("appointments")
        .update({
          status: apptStatus,
          ...(nextState === "VISIT_COMPLETED" ? { checked_out_at: now } : {}),
        })
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId)

      if (!apptUpdateError) {
        appointmentUpdate = {
          status: apptStatus,
          ...(nextState === "VISIT_COMPLETED" ? { checked_out_at: now } : {}),
        }
      }
    }

    return NextResponse.json({
      visit: {
        visitId: updated.id,
        appointmentId: updated.appointment_id,
        clinicId: updated.clinic_id,
        status: updated.status,
        timestamps: updated.timestamps ?? {},
        flags: updated.flags ?? {},
        room: updated.room ?? null,
        dentistId: updated.dentist_id ?? null,
        assistantId: updated.assistant_id ?? null,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
      appointment: appointmentUpdate,
    })
  } catch (err) {
    console.error("[VISITS_TRANSITION]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
