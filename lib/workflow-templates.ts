/**
 * Dynamic Patient Visit Workflow – template config and helpers.
 * Maps spec templates to existing VisitState; used by API and progress panel.
 */

import { ALLOWED_TRANSITIONS, VISIT_STATES, type VisitState, type TransitionRole } from "./visit-state-machine"

export const WORKFLOW_TEMPLATE_IDS = [
  "default_clinic_workflow",
  "full_clinic_workflow",
] as const

export type WorkflowTemplateId = (typeof WORKFLOW_TEMPLATE_IDS)[number]

export const DEFAULT_WORKFLOW_TEMPLATE: WorkflowTemplateId = "full_clinic_workflow"

/** Single node in a custom workflow config (linear flow). */
export interface WorkflowTemplateNode {
  state: VisitState
  label?: string
  assigned_role: TransitionRole
}

/** Custom workflow config shape (stored in workflow_templates.config). */
export interface WorkflowTemplateConfig {
  nodes: WorkflowTemplateNode[]
}

/** Stage library for the builder palette: all draggable stages with default role and label. */
export const STAGE_LIBRARY: { state: VisitState; label: string; defaultRole: TransitionRole }[] = [
  { state: "CHECKED_IN", label: "Check-In", defaultRole: "FRONT_DESK" },
  { state: "READY_FOR_HYGIENE", label: "Ready for hygiene", defaultRole: "FRONT_DESK" },
  { state: "HYGIENE_IN_PROGRESS", label: "Hygiene", defaultRole: "HYGIENIST" },
  { state: "HYGIENE_COMPLETED", label: "Hygiene completed", defaultRole: "HYGIENIST" },
  { state: "READY_FOR_EXAM", label: "Ready for exam", defaultRole: "FRONT_DESK" },
  { state: "EXAM_IN_PROGRESS", label: "Exam & Treatment Plan", defaultRole: "DENTIST" },
  { state: "TREATMENT_PLANNED", label: "Treatment planned", defaultRole: "DENTIST" },
  { state: "READY_FOR_BILLING", label: "Ready for billing", defaultRole: "FRONT_DESK" },
  { state: "BILLED", label: "Billed", defaultRole: "FRONT_DESK" },
  { state: "PAYMENT_COMPLETED", label: "Payment completed", defaultRole: "FRONT_DESK" },
  { state: "VISIT_COMPLETED", label: "Visit completed", defaultRole: "FRONT_DESK" },
]

/** Spec node id -> VisitState (for linear nodes). Parallel nodes map to sub-steps. */
export const NODE_ID_TO_STATE: Record<string, VisitState> = {
  node_checkin: "CHECKED_IN",
  node_insurance: "READY_FOR_EXAM", // no separate state; insurance is a flag before READY_FOR_EXAM
  node_ready_for_exam: "READY_FOR_EXAM",
  node_exam_in_progress: "EXAM_IN_PROGRESS",
  node_treatment_planned: "TREATMENT_PLANNED",
  node_billing_ready: "READY_FOR_BILLING",
  node_visit_completed: "VISIT_COMPLETED",
  // Full template only
  node_parallel_preexam: "READY_FOR_EXAM",
  node_hygiene: "HYGIENE_IN_PROGRESS",
  node_xray: "READY_FOR_EXAM",
}

/** Linear step for UI: either a single state or a parallel group (subSteps). */
export interface WorkflowStep {
  id: string
  label: string
  state: VisitState
  /** For parallel node: sub-step labels (e.g. Hygiene, X-Ray); all must be "done" via flags before advancing. */
  subSteps?: { id: string; label: string; state: VisitState }[]
}

/** Default template: linear only (Check-In -> Ready for Exam -> ... -> Visit Completed). No hygiene. */
const DEFAULT_TEMPLATE_STEPS: WorkflowStep[] = [
  { id: "node_checkin", label: "Check-In", state: "CHECKED_IN" },
  { id: "node_insurance", label: "Insurance Verification", state: "READY_FOR_EXAM" },
  { id: "node_ready_for_exam", label: "Ready for Exam", state: "READY_FOR_EXAM" },
  { id: "node_exam_in_progress", label: "Exam & Treatment Plan", state: "EXAM_IN_PROGRESS" },
  { id: "node_treatment_planned", label: "Treatment Planned", state: "TREATMENT_PLANNED" },
  { id: "node_billing_ready", label: "Billing & Payment", state: "READY_FOR_BILLING" },
  { id: "node_visit_completed", label: "Visit Completed", state: "VISIT_COMPLETED" },
]

/** Full template: insurance then parallel gate (Hygiene + X-Ray) then exam; spec-aligned. */
const FULL_TEMPLATE_STEPS: WorkflowStep[] = [
  { id: "node_checkin", label: "Check-In", state: "CHECKED_IN" },
  {
    id: "node_parallel_preexam",
    label: "Pre-Exam (Insurance, Hygiene, X-Ray)",
    state: "READY_FOR_EXAM",
    subSteps: [
      { id: "node_insurance", label: "Insurance Verification", state: "READY_FOR_EXAM" },
      { id: "node_hygiene", label: "Hygiene", state: "HYGIENE_IN_PROGRESS" },
      { id: "node_xray", label: "X-Ray / Lab Work", state: "READY_FOR_EXAM" },
    ],
  },
  { id: "node_exam_in_progress", label: "Exam & Treatment Plan", state: "EXAM_IN_PROGRESS" },
  { id: "node_treatment_planned", label: "Treatment planned", state: "TREATMENT_PLANNED" },
  { id: "node_billing_ready", label: "Ready for billing", state: "READY_FOR_BILLING" },
  { id: "node_billed", label: "Billed", state: "BILLED" },
  { id: "node_payment_completed", label: "Payment completed", state: "PAYMENT_COMPLETED" },
  { id: "node_visit_completed", label: "Visit completed", state: "VISIT_COMPLETED" },
]

/** Ordered list of steps for the progress panel (flattened; current status matched by state). */
export function getStepsForTemplate(templateId: string | null | undefined): WorkflowStep[] {
  if (templateId === "default_clinic_workflow") return DEFAULT_TEMPLATE_STEPS
  return FULL_TEMPLATE_STEPS
}

/** Ordered list of VisitState values for a template (for transition validation and progress index). */
export function getOrderedStatesForTemplate(templateId: string | null | undefined): VisitState[] {
  const steps = getStepsForTemplate(templateId)
  const states: VisitState[] = []
  for (const s of steps) {
    if (s.subSteps) {
      for (const sub of s.subSteps) states.push(sub.state)
      states.push(s.state)
    } else {
      states.push(s.state)
    }
  }
  return [...new Set(states)]
}

/** Allowed next states from current state. For default template, CHECKED_IN -> READY_FOR_EXAM only (no READY_FOR_HYGIENE). */
export function getAllowedTransitionsForTemplate(
  currentState: VisitState,
  templateId: string | null | undefined
): VisitState[] {
  const defaultAllowed: Partial<Record<VisitState, VisitState[]>> = {
    CHECKED_IN: ["READY_FOR_EXAM"],
    READY_FOR_EXAM: ["EXAM_IN_PROGRESS"],
    EXAM_IN_PROGRESS: ["TREATMENT_PLANNED"],
    TREATMENT_PLANNED: ["READY_FOR_BILLING"],
    READY_FOR_BILLING: ["BILLED"],
    BILLED: ["PAYMENT_COMPLETED"],
    PAYMENT_COMPLETED: ["VISIT_COMPLETED"],
    VISIT_COMPLETED: [],
    CANCELLED: [],
  }
  if (templateId === "default_clinic_workflow") {
    const next = defaultAllowed[currentState]
    if (next) return next
    return []
  }
  const allowed = ALLOWED_TRANSITIONS[currentState]
  return allowed ?? []
}

/** Flattened list of states in display order for a template (one per step; parallel gate = one READY_FOR_EXAM). */
export function getProgressStepOrderForTemplate(templateId: string | null | undefined): VisitState[] {
  if (templateId === "default_clinic_workflow") {
    return [
      "CHECKED_IN",
      "READY_FOR_EXAM",
      "EXAM_IN_PROGRESS",
      "TREATMENT_PLANNED",
      "READY_FOR_BILLING",
      "BILLED",
      "PAYMENT_COMPLETED",
      "VISIT_COMPLETED",
    ]
  }
  if (templateId === "full_clinic_workflow") {
    return [
      "CHECKED_IN",
      "READY_FOR_EXAM",
      "EXAM_IN_PROGRESS",
      "TREATMENT_PLANNED",
      "READY_FOR_BILLING",
      "BILLED",
      "PAYMENT_COMPLETED",
      "VISIT_COMPLETED",
    ]
  }
  return [
    "CHECKED_IN",
    "READY_FOR_HYGIENE",
    "HYGIENE_IN_PROGRESS",
    "HYGIENE_COMPLETED",
    "READY_FOR_EXAM",
    "EXAM_IN_PROGRESS",
    "TREATMENT_PLANNED",
    "READY_FOR_BILLING",
    "BILLED",
    "PAYMENT_COMPLETED",
    "VISIT_COMPLETED",
  ]
}

/** Label for a state when using a template (falls back to state name if no step match). */
export function getStepLabelForTemplate(
  state: VisitState,
  templateId: string | null | undefined
): string {
  const steps = getStepsForTemplate(templateId)
  for (const s of steps) {
    if (s.state === state && !s.subSteps) return s.label
    if (s.subSteps) {
      for (const sub of s.subSteps) {
        if (sub.state === state) return sub.label
      }
      if (s.state === state) return s.label
    }
  }
  const labels: Record<VisitState, string> = {
    SCHEDULED: "Scheduled",
    CHECKED_IN: "Checked in",
    READY_FOR_HYGIENE: "Ready for hygiene",
    HYGIENE_IN_PROGRESS: "Hygiene in progress",
    HYGIENE_COMPLETED: "Hygiene completed",
    READY_FOR_EXAM: "Ready for exam",
    EXAM_IN_PROGRESS: "Exam in progress",
    TREATMENT_PLANNED: "Treatment planned",
    READY_FOR_BILLING: "Ready for billing",
    BILLED: "Billed",
    PAYMENT_COMPLETED: "Payment completed",
    VISIT_COMPLETED: "Visit completed",
    CANCELLED: "Cancelled",
  }
  return labels[state] ?? state
}

// --- Custom workflow (DB-backed template) helpers ---

const VALID_STATES = new Set<string>(VISIT_STATES)

/** Validate custom config: first CHECKED_IN, last VISIT_COMPLETED, no duplicates, each state valid. */
export function validateCustomConfig(config: unknown): { valid: boolean; error?: string } {
  if (!config || typeof config !== "object" || !Array.isArray((config as WorkflowTemplateConfig).nodes)) {
    return { valid: false, error: "config.nodes must be an array" }
  }
  const nodes = (config as WorkflowTemplateConfig).nodes
  if (nodes.length === 0) return { valid: false, error: "At least one node required" }
  if (nodes[0].state !== "CHECKED_IN") return { valid: false, error: "First stage must be Check-In (CHECKED_IN)" }
  if (nodes[nodes.length - 1].state !== "VISIT_COMPLETED") {
    return { valid: false, error: "Last stage must be Visit Completed (VISIT_COMPLETED)" }
  }
  const seen = new Set<VisitState>()
  for (const n of nodes) {
    if (!VALID_STATES.has(n.state)) return { valid: false, error: `Invalid state: ${n.state}` }
    if (seen.has(n.state)) return { valid: false, error: `Duplicate stage: ${n.state}` }
    seen.add(n.state)
  }
  return { valid: true }
}

/** Ordered VisitState list from custom config (for progress panel and transition validation). */
export function getProgressStepOrderFromCustomConfig(config: WorkflowTemplateConfig): VisitState[] {
  return (config.nodes ?? []).map((n) => n.state)
}

/** Allowed next state from current state for custom template: only the next node in list. */
export function getAllowedTransitionsFromCustomConfig(
  config: WorkflowTemplateConfig,
  currentState: VisitState
): VisitState[] {
  const nodes = config.nodes ?? []
  const i = nodes.findIndex((n) => n.state === currentState)
  if (i < 0 || i >= nodes.length - 1) return []
  return [nodes[i + 1].state]
}

/** Step label from custom config (node label or fallback). */
export function getStepLabelFromCustomConfig(config: WorkflowTemplateConfig, state: VisitState): string {
  const node = (config.nodes ?? []).find((n) => n.state === state)
  if (node?.label) return node.label
  const labels: Record<VisitState, string> = {
    SCHEDULED: "Scheduled",
    CHECKED_IN: "Checked in",
    READY_FOR_HYGIENE: "Ready for hygiene",
    HYGIENE_IN_PROGRESS: "Hygiene in progress",
    HYGIENE_COMPLETED: "Hygiene completed",
    READY_FOR_EXAM: "Ready for exam",
    EXAM_IN_PROGRESS: "Exam in progress",
    TREATMENT_PLANNED: "Treatment planned",
    READY_FOR_BILLING: "Ready for billing",
    BILLED: "Billed",
    PAYMENT_COMPLETED: "Payment completed",
    VISIT_COMPLETED: "Visit completed",
    CANCELLED: "Cancelled",
  }
  return labels[state] ?? state
}
