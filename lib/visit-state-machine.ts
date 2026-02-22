/**
 * Patient Visit Flow Engine v2 – single source of truth.
 * Used by API (transition validation) and UI (step order, labels).
 * Aligns with PatientVisitWorkflow 2.0 spec (hygiene path + billing path).
 */

export const VISIT_STATES = [
  "SCHEDULED",
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
  "CANCELLED",
] as const

export type VisitState = (typeof VISIT_STATES)[number]

export const ALLOWED_TRANSITIONS: Record<VisitState, VisitState[]> = {
  SCHEDULED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["READY_FOR_HYGIENE", "READY_FOR_EXAM"],
  READY_FOR_HYGIENE: ["HYGIENE_IN_PROGRESS"],
  HYGIENE_IN_PROGRESS: ["HYGIENE_COMPLETED"],
  HYGIENE_COMPLETED: ["READY_FOR_EXAM"],
  READY_FOR_EXAM: ["EXAM_IN_PROGRESS"],
  EXAM_IN_PROGRESS: ["TREATMENT_PLANNED"],
  TREATMENT_PLANNED: ["READY_FOR_BILLING"],
  READY_FOR_BILLING: ["BILLED"],
  BILLED: ["PAYMENT_COMPLETED"],
  PAYMENT_COMPLETED: ["VISIT_COMPLETED"],
  VISIT_COMPLETED: [],
  CANCELLED: [],
}

/** Requirements that must be true in visit.flags (or derived) before entering each step. Aligned with spec transition_rules.validations_required. */
export const STEP_REQUIREMENTS: Partial<Record<VisitState, string[]>> = {
  READY_FOR_EXAM: ["insuranceVerified", "medicalHistorySigned", "consentSigned", "roomAssigned"],
  TREATMENT_PLANNED: ["clinicalNotesCompleted"],
  READY_FOR_BILLING: ["treatmentPlanSaved"],
  // PAYMENT_COMPLETED: validated in API (payment_amount_received >= invoice_total)
}

/** Permission role for transition checks (maps user.role to this). Spec uses HYGIENIST. */
export type TransitionRole = "FRONT_DESK" | "HYGIENIST" | "DENTIST" | "ADMIN"

/** Which transition roles can move to which states (can perform transition that ends in this state) */
export const ROLE_TRANSITION_PERMISSIONS: Record<TransitionRole, VisitState[] | "*"> = {
  FRONT_DESK: [
    "CHECKED_IN",
    "READY_FOR_HYGIENE",
    "READY_FOR_EXAM",
    "READY_FOR_BILLING",
    "BILLED",
    "PAYMENT_COMPLETED",
    "VISIT_COMPLETED",
  ],
  HYGIENIST: ["HYGIENE_IN_PROGRESS", "HYGIENE_COMPLETED", "READY_FOR_EXAM"],
  DENTIST: ["EXAM_IN_PROGRESS", "TREATMENT_PLANNED"],
  ADMIN: "*",
}

/** Map existing users.role to transition permission role */
export function getTransitionPermissionRole(userRole: string | null | undefined): TransitionRole | null {
  if (!userRole) return null
  const r = userRole.toLowerCase()
  if (r === "super_admin" || r === "clinic_admin") return "ADMIN"
  if (r === "receptionist" || r === "accountant") return "FRONT_DESK"
  if (r === "hygienist") return "HYGIENIST"
  if (r === "dentist") return "DENTIST"
  return null
}

export interface VisitData {
  flags?: Record<string, boolean>
  room?: string | null
}

export interface CanTransitionResult {
  allowed: boolean
  reason?: string
}

/**
 * Backend validation: state machine + role + step requirements.
 * Call before updating visit status.
 */
export function canTransition(
  currentState: string,
  nextState: string,
  visitData: VisitData,
  userRole: string | null | undefined
): CanTransitionResult {
  const allowed = ALLOWED_TRANSITIONS[currentState as VisitState]
  if (!allowed || !allowed.includes(nextState as VisitState)) {
    return { allowed: false, reason: "Invalid state transition" }
  }

  const role = getTransitionPermissionRole(userRole)
  if (!role) {
    return { allowed: false, reason: "Role not permitted" }
  }

  const perms = ROLE_TRANSITION_PERMISSIONS[role]
  const canPerformNext = perms === "*" || (Array.isArray(perms) && perms.includes(nextState as VisitState))
  if (!canPerformNext) {
    return { allowed: false, reason: "Role not permitted for this step" }
  }

  const requirements = STEP_REQUIREMENTS[nextState as VisitState]
  if (requirements && requirements.length > 0) {
    const flags = visitData.flags ?? {}
    for (const field of requirements) {
      if (field === "roomAssigned") {
        const hasRoom = !!(visitData.room?.trim())
        if (!hasRoom) {
          return { allowed: false, reason: "Missing required field: roomAssigned (room must be set)" }
        }
      } else if (!flags[field]) {
        return { allowed: false, reason: `Missing required field: ${field}` }
      }
    }
  }

  return { allowed: true }
}

/** Ordered steps for the progress panel (main flow; hygiene and exam-only paths both converge at READY_FOR_EXAM). */
export const VISIT_PROGRESS_STEPS: VisitState[] = [
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

/** Human-readable labels for visit states */
export const VISIT_STATE_LABELS: Record<VisitState, string> = {
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

/** Timestamp key in visit.timestamps for each state (camelCase for JSON) */
export const STATE_TIMESTAMP_KEYS: Record<VisitState, string> = {
  SCHEDULED: "scheduled",
  CHECKED_IN: "checkedIn",
  READY_FOR_HYGIENE: "readyForHygiene",
  HYGIENE_IN_PROGRESS: "hygieneInProgress",
  HYGIENE_COMPLETED: "hygieneCompleted",
  READY_FOR_EXAM: "readyForExam",
  EXAM_IN_PROGRESS: "examInProgress",
  TREATMENT_PLANNED: "treatmentPlanned",
  READY_FOR_BILLING: "readyForBilling",
  BILLED: "billed",
  PAYMENT_COMPLETED: "paymentCompleted",
  VISIT_COMPLETED: "visitCompleted",
  CANCELLED: "cancelled",
}
