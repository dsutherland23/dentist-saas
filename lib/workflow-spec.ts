/**
 * Dynamic Patient Visit Workflow 2.0 – spec module (single source of truth).
 * Types, Zod schema, preset templates, and validation expression → flag mapping.
 */

import { z } from "zod"
import type { VisitState, TransitionRole } from "./visit-state-machine"

// --- Roles ---
export const SpecRoleIds = [
  "role_frontdesk",
  "role_dentist",
  "role_hygienist",
  "role_admin",
] as const
export type SpecRoleId = (typeof SpecRoleIds)[number]

export const SPEC_ROLE_TO_TRANSITION_ROLE: Record<SpecRoleId, TransitionRole> = {
  role_frontdesk: "FRONT_DESK",
  role_dentist: "DENTIST",
  role_hygienist: "HYGIENIST",
  role_admin: "ADMIN",
}

export const roleSchema = z.object({
  id: z.enum(SpecRoleIds),
  name: z.string(),
})

// --- Linear node (spec shape) ---
export const linearNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  assigned_role: z.string().nullable(),
  type: z.literal("linear"),
  validations_required: z.array(z.string()).optional().default([]),
  next_nodes: z.array(z.string()),
  notifications_trigger: z.array(z.string()).optional().default([]),
  offline_action_queue: z.boolean().optional().default(true),
})

// --- Parallel branch node (inside parallel_nodes) ---
export const parallelBranchNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  assigned_role: z.string().nullable(),
  validations_required: z.array(z.string()).optional().default([]),
  notifications_trigger: z.array(z.string()).optional().default([]),
  offline_action_queue: z.boolean().optional().default(true),
})

// --- Parallel node (spec shape) ---
export const parallelNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  assigned_role: z.string().nullable(),
  type: z.literal("parallel"),
  next_nodes: z.array(z.string()),
  parallel_nodes: z.array(parallelBranchNodeSchema),
})

export const workflowNodeSchema = z.union([linearNodeSchema, parallelNodeSchema])

// --- Template ---
export const workflowTemplateSchema = z.object({
  template_id: z.string(),
  name: z.string(),
  offline_mode: z.boolean().optional().default(true),
  nodes: z.array(workflowNodeSchema),
})

// --- Notifications ---
export const notificationDefSchema = z.object({
  type: z.string(),
  payload: z.array(z.string()).optional().default([]),
})

// --- Full spec ---
export const workflowSpecSchema = z.object({
  module: z.string().optional(),
  version: z.string().optional(),
  roles: z.array(roleSchema),
  templates: z.array(workflowTemplateSchema),
  notifications: z.record(z.string(), notificationDefSchema).optional().default({}),
  audit_log: z
    .object({
      enabled: z.boolean().optional().default(true),
      track_fields: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ enabled: true, track_fields: [] }),
  offline_sync: z
    .object({
      enabled: z.boolean().optional().default(true),
      local_storage_engine: z.string().optional(),
      sync_strategy: z.string().optional(),
      auto_sync_on_reconnect: z.boolean().optional(),
      conflict_resolution: z.string().optional(),
      encrypted_storage: z.boolean().optional(),
    })
    .optional()
    .default({ enabled: true }),
})

export type WorkflowSpec = z.infer<typeof workflowSpecSchema>
export type WorkflowTemplateSpec = z.infer<typeof workflowTemplateSchema>
export type WorkflowNodeSpec = z.infer<typeof workflowNodeSchema>
export type LinearNodeSpec = z.infer<typeof linearNodeSchema>
export type ParallelNodeSpec = z.infer<typeof parallelNodeSchema>
export type ParallelBranchNodeSpec = z.infer<typeof parallelBranchNodeSchema>

// --- Preset templates (single source of truth from spec) ---
export const DYNAMIC_WORKFLOW_SPEC: WorkflowSpec = {
  module: "DynamicPatientVisitWorkflow",
  version: "2.0",
  roles: [
    { id: "role_frontdesk", name: "Front Desk" },
    { id: "role_dentist", name: "Dentist" },
    { id: "role_hygienist", name: "Hygienist" },
    { id: "role_admin", name: "Admin" },
  ],
  templates: [
    {
      template_id: "default_clinic_workflow",
      name: "Default Clinic Workflow",
      offline_mode: true,
      nodes: [
        {
          id: "node_checkin",
          name: "Check-In",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["patient_exists == true"],
          next_nodes: ["node_insurance"],
          notifications_trigger: ["notify_next_node"],
          offline_action_queue: true,
        },
        {
          id: "node_insurance",
          name: "Insurance Verification",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["insurance_info_complete == true"],
          next_nodes: ["node_ready_for_exam"],
          notifications_trigger: ["notify_next_node"],
          offline_action_queue: true,
        },
        {
          id: "node_ready_for_exam",
          name: "Ready for Exam",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: [
            "medical_history_signed == true",
            "consent_signed == true",
            "room_assigned == true",
          ],
          next_nodes: ["node_exam_in_progress"],
          notifications_trigger: ["notify_assigned_dentist"],
          offline_action_queue: true,
        },
        {
          id: "node_exam_in_progress",
          name: "Exam & Treatment Plan",
          assigned_role: "role_dentist",
          type: "linear",
          validations_required: ["clinical_notes_completed == true"],
          next_nodes: ["node_treatment_planned"],
          notifications_trigger: ["notify_front_desk"],
          offline_action_queue: true,
        },
        {
          id: "node_treatment_planned",
          name: "Treatment Planned",
          assigned_role: "role_dentist",
          type: "linear",
          validations_required: ["treatment_plan_saved == true"],
          next_nodes: ["node_billing_ready"],
          notifications_trigger: ["notify_front_desk"],
          offline_action_queue: true,
        },
        {
          id: "node_billing_ready",
          name: "Billing & Payment",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["invoice_generated == true"],
          next_nodes: ["node_visit_completed"],
          notifications_trigger: ["notify_admin"],
          offline_action_queue: true,
        },
        {
          id: "node_visit_completed",
          name: "Visit Completed",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["payment_completed == true"],
          next_nodes: [],
          notifications_trigger: ["notify_admin"],
          offline_action_queue: true,
        },
      ],
    },
    {
      template_id: "full_clinic_workflow",
      name: "Full Clinic Workflow with Hygiene & X-Ray",
      offline_mode: true,
      nodes: [
        {
          id: "node_checkin",
          name: "Check-In",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["patient_exists == true"],
          next_nodes: ["node_insurance"],
          notifications_trigger: ["notify_next_node"],
          offline_action_queue: true,
        },
        {
          id: "node_insurance",
          name: "Insurance Verification",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["insurance_info_complete == true"],
          next_nodes: ["node_parallel_preexam"],
          notifications_trigger: ["notify_next_node"],
          offline_action_queue: true,
        },
        {
          id: "node_parallel_preexam",
          name: "Pre-Exam Parallel Tasks",
          assigned_role: null,
          type: "parallel",
          next_nodes: ["node_exam_in_progress"],
          parallel_nodes: [
            {
              id: "node_hygiene",
              name: "Hygiene",
              assigned_role: "role_hygienist",
              validations_required: ["hygiene_notes_complete == true"],
              notifications_trigger: ["notify_dentist"],
              offline_action_queue: true,
            },
            {
              id: "node_xray",
              name: "X-Ray / Lab Work",
              assigned_role: "role_dentist",
              validations_required: ["xrays_uploaded == true"],
              notifications_trigger: ["notify_dentist"],
              offline_action_queue: true,
            },
          ],
        },
        {
          id: "node_exam_in_progress",
          name: "Exam & Treatment Plan",
          assigned_role: "role_dentist",
          type: "linear",
          validations_required: ["clinical_notes_completed == true"],
          next_nodes: ["node_treatment_planned"],
          notifications_trigger: ["notify_front_desk"],
          offline_action_queue: true,
        },
        {
          id: "node_treatment_planned",
          name: "Treatment Planned",
          assigned_role: "role_dentist",
          type: "linear",
          validations_required: ["treatment_plan_saved == true"],
          next_nodes: ["node_billing_ready"],
          notifications_trigger: ["notify_front_desk"],
          offline_action_queue: true,
        },
        {
          id: "node_billing_ready",
          name: "Billing & Payment",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["invoice_generated == true"],
          next_nodes: ["node_visit_completed"],
          notifications_trigger: ["notify_admin"],
          offline_action_queue: true,
        },
        {
          id: "node_visit_completed",
          name: "Visit Completed",
          assigned_role: "role_frontdesk",
          type: "linear",
          validations_required: ["payment_completed == true"],
          next_nodes: [],
          notifications_trigger: ["notify_admin"],
          offline_action_queue: true,
        },
      ],
    },
  ],
  notifications: {
    notify_assigned_dentist: {
      type: "real_time",
      payload: ["patient_name", "room_number", "appointment_reason", "medical_alert_flag"],
    },
    notify_front_desk: {
      type: "real_time",
      payload: ["patient_name", "treatment_summary", "estimated_patient_portion"],
    },
    notify_admin: {
      type: "real_time",
      payload: ["visit_status_update", "patient_name", "role", "timestamp"],
    },
  },
  audit_log: {
    enabled: true,
    track_fields: ["status_change", "user_id", "timestamp", "before_value", "after_value"],
  },
  offline_sync: {
    enabled: true,
    local_storage_engine: "IndexedDB",
    sync_strategy: "queued_actions",
    auto_sync_on_reconnect: true,
    conflict_resolution: "last_write_wins_or_manual_merge",
    encrypted_storage: true,
  },
}

// --- Validation expression → flag/key mapping (spec expressions to engine flags) ---
const EXPRESSION_TO_FLAG: Record<string, string> = {
  "patient_exists == true": "__visit_exists__", // special: always true when we have a visit
  "insurance_info_complete == true": "insuranceVerified",
  "medical_history_signed == true": "medicalHistorySigned",
  "consent_signed == true": "consentSigned",
  "room_assigned == true": "roomAssigned",
  "clinical_notes_completed == true": "clinicalNotesCompleted",
  "treatment_plan_saved == true": "treatmentPlanSaved",
  "invoice_generated == true": "__invoice_exists__", // special: checked in API
  "payment_completed == true": "__payment_done__", // special: checked in API
  "hygiene_notes_complete == true": "hygieneNotesComplete",
  "xrays_uploaded == true": "xraysUploaded",
}

/** Map spec validations_required expressions to internal flag names (or special keys). */
export function specExpressionsToFlagNames(expressions: string[]): string[] {
  const out: string[] = []
  for (const expr of expressions) {
    const key = EXPRESSION_TO_FLAG[expr.trim()]
    if (key && !key.startsWith("__")) out.push(key)
    if (key?.startsWith("__")) out.push(key) // include special keys for API to handle
  }
  return [...new Set(out)]
}

/** Check if an expression is a "special" check (visit exists, invoice, payment) handled outside flags. */
export function isSpecialValidation(expression: string): boolean {
  const key = EXPRESSION_TO_FLAG[expression.trim()]
  return key?.startsWith("__") ?? false
}

/**
 * Resolve spec validations for a target node into a list of flag names and special keys.
 * Used by transition API and progress panel to enforce requirements.
 */
export function getRequiredFlagsForSpecExpressions(expressions: string[]): {
  flags: string[]
  needsInvoice: boolean
  needsPayment: boolean
} {
  const flags: string[] = []
  let needsInvoice = false
  let needsPayment = false
  for (const expr of expressions) {
    const key = EXPRESSION_TO_FLAG[expr.trim()]
    if (!key) continue
    if (key === "__visit_exists__") continue // implied when we have a visit
    if (key === "__invoice_exists__") {
      needsInvoice = true
      continue
    }
    if (key === "__payment_done__") {
      needsPayment = true
      continue
    }
    flags.push(key)
  }
  return { flags, needsInvoice, needsPayment }
}

/** Get template by id from the spec. */
export function getSpecTemplate(templateId: string): WorkflowTemplateSpec | undefined {
  return DYNAMIC_WORKFLOW_SPEC.templates.find((t) => t.template_id === templateId)
}

/** Get notification triggers for a spec node (by node id) in a template. */
export function getNotificationTriggersForNode(
  templateId: string,
  nodeId: string
): string[] {
  const t = getSpecTemplate(templateId)
  if (!t) return []
  for (const node of t.nodes) {
    if (node.id === nodeId && "notifications_trigger" in node) {
      return node.notifications_trigger ?? []
    }
    if ("parallel_nodes" in node) {
      for (const sub of node.parallel_nodes) {
        if (sub.id === nodeId) return sub.notifications_trigger ?? []
      }
    }
  }
  return []
}

/** Get notification triggers for a transition (node we're leaving = fromState -> toState). */
export function getNotificationTriggersForTransition(
  templateId: string,
  fromState: VisitState,
  toState: VisitState
): string[] {
  const t = getSpecTemplate(templateId)
  if (!t) return []
  for (const node of t.nodes) {
    if (node.type === "linear") {
      const nodeState = stateFromSpecNodeId(node.id, templateId)
      if (nodeState === fromState) {
        const nextStates = (node.next_nodes || []).map((id) => stateFromSpecNodeId(id, templateId))
        if (nextStates.includes(toState)) return node.notifications_trigger ?? []
      }
    }
    if ("parallel_nodes" in node && "next_nodes" in node) {
      const gateState = stateFromSpecNodeId(node.id, templateId)
      if (gateState === fromState) {
        const nextStates = (node.next_nodes || []).map((id) => stateFromSpecNodeId(id, templateId))
        if (nextStates.includes(toState)) {
          const all: string[] = []
          for (const sub of node.parallel_nodes) {
            all.push(...(sub.notifications_trigger ?? []))
          }
          return [...new Set(all)]
        }
      }
    }
  }
  return []
}

/** Map spec node id to VisitState (for use from workflow-templates and API). */
export function stateFromSpecNodeId(nodeId: string, _templateId: string): VisitState | null {
  const stateMap: Record<string, VisitState> = {
    node_checkin: "CHECKED_IN",
    node_insurance: "READY_FOR_EXAM",
    node_ready_for_exam: "READY_FOR_EXAM",
    node_exam_in_progress: "EXAM_IN_PROGRESS",
    node_treatment_planned: "TREATMENT_PLANNED",
    node_billing_ready: "READY_FOR_BILLING",
    node_visit_completed: "VISIT_COMPLETED",
    node_parallel_preexam: "READY_FOR_EXAM",
    node_hygiene: "HYGIENE_IN_PROGRESS",
    node_xray: "READY_FOR_EXAM",
  }
  return stateMap[nodeId] ?? null
}

/** Get validations_required expressions for the node we are leaving when doing fromState -> toState. */
export function getRequiredValidationsForTransition(
  templateId: string,
  fromState: VisitState,
  toState: VisitState
): string[] {
  const t = getSpecTemplate(templateId)
  if (!t) return []
  for (const node of t.nodes) {
    if (node.type === "linear") {
      const nodeState = stateFromSpecNodeId(node.id, templateId)
      if (nodeState === fromState) {
        const nextStates = (node.next_nodes || []).map((id) => stateFromSpecNodeId(id, templateId))
        if (nextStates.includes(toState)) return node.validations_required ?? []
      }
    }
    if ("parallel_nodes" in node && "next_nodes" in node) {
      const gateState = stateFromSpecNodeId(node.id, templateId)
      if (gateState === fromState) {
        const nextStates = (node.next_nodes || []).map((id) => stateFromSpecNodeId(id, templateId))
        if (nextStates.includes(toState)) {
          const all: string[] = []
          for (const sub of node.parallel_nodes) {
            all.push(...(sub.validations_required ?? []))
          }
          return [...new Set(all)]
        }
      }
    }
  }
  return []
}

/** Validate runtime config (e.g. custom workflow from DB) with Zod. */
export function validateWorkflowSpec(input: unknown) {
  return workflowSpecSchema.safeParse(input)
}

/** Validate a single template config (for custom workflow save). */
export function validateTemplateConfig(input: unknown) {
  return workflowTemplateSchema.safeParse(input)
}

// --- Custom workflow config (DB workflow_templates.config) ---
const visitStateEnum = z.enum([
  "SCHEDULED", "CHECKED_IN", "READY_FOR_HYGIENE", "HYGIENE_IN_PROGRESS", "HYGIENE_COMPLETED",
  "READY_FOR_EXAM", "EXAM_IN_PROGRESS", "TREATMENT_PLANNED", "READY_FOR_BILLING",
  "BILLED", "PAYMENT_COMPLETED", "VISIT_COMPLETED", "CANCELLED",
])
const transitionRoleEnum = z.enum(["FRONT_DESK", "HYGIENIST", "DENTIST", "ADMIN"])

export const customWorkflowNodeSchema = z.object({
  state: visitStateEnum,
  label: z.string().optional(),
  assigned_role: transitionRoleEnum,
})
export const customWorkflowConfigSchema = z.object({
  nodes: z.array(customWorkflowNodeSchema).min(1, "At least one node required"),
}).refine(
  (data) => data.nodes[0]?.state === "CHECKED_IN",
  { message: "First stage must be Check-In (CHECKED_IN)", path: ["nodes", 0] }
).refine(
  (data) => data.nodes[data.nodes.length - 1]?.state === "VISIT_COMPLETED",
  { message: "Last stage must be Visit Completed (VISIT_COMPLETED)", path: ["nodes"] }
).refine(
  (data) => {
    const states = data.nodes.map((n) => n.state)
    return new Set(states).size === states.length
  },
  { message: "Duplicate stages are not allowed", path: ["nodes"] }
)

export type CustomWorkflowConfigZod = z.infer<typeof customWorkflowConfigSchema>

/** Validate custom workflow config with Zod; returns { valid, error? } for API use. */
export function validateCustomWorkflowConfigWithZod(
  config: unknown
): { valid: true; data: CustomWorkflowConfigZod } | { valid: false; error: string } {
  const result = customWorkflowConfigSchema.safeParse(config)
  if (result.success) return { valid: true, data: result.data }
  const first = result.error.flatten().formErrors[0] ?? result.error.issues[0]?.message ?? "Invalid config"
  return { valid: false, error: typeof first === "string" ? first : String(first) }
}
