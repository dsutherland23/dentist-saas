/**
 * Patient Visit Flow Engine – single source of truth.
 * Used by API (transition validation) and UI (step order, labels).
 */

export const VISIT_STATES = [
  "SCHEDULED",
  "ARRIVED",
  "CHECKED_IN",
  "MEDICAL_REVIEWED",
  "IN_CHAIR",
  "EXAM_COMPLETED",
  "TREATMENT_PLANNED",
  "TREATED",
  "CHECKOUT_PENDING",
  "COMPLETED",
  "CANCELLED",
] as const

export type VisitState = (typeof VISIT_STATES)[number]

export const ALLOWED_TRANSITIONS: Record<VisitState, VisitState[]> = {
  SCHEDULED: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["CHECKED_IN"],
  CHECKED_IN: ["MEDICAL_REVIEWED"],
  MEDICAL_REVIEWED: ["IN_CHAIR"],
  IN_CHAIR: ["EXAM_COMPLETED"],
  EXAM_COMPLETED: ["TREATMENT_PLANNED"],
  TREATMENT_PLANNED: ["TREATED", "CHECKOUT_PENDING"],
  TREATED: ["CHECKOUT_PENDING"],
  CHECKOUT_PENDING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
}

/** Requirements that must be true in visit.flags before entering each step */
export const STEP_REQUIREMENTS: Partial<Record<VisitState, string[]>> = {
  CHECKED_IN: ["insuranceVerified", "contactConfirmed", "consentSigned"],
  MEDICAL_REVIEWED: ["allergiesReviewed", "medicationsReviewed"],
  EXAM_COMPLETED: ["diagnosisEntered"],
  TREATMENT_PLANNED: ["procedureCodesAdded", "costCalculated"],
  CHECKOUT_PENDING: ["paymentProcessed", "nextAppointmentScheduled"],
}

/** Permission role for transition checks (maps user.role to this) */
export type TransitionRole = "FRONT_DESK" | "ASSISTANT" | "DENTIST" | "ADMIN"

/** Which transition roles can move to which states */
export const ROLE_TRANSITION_PERMISSIONS: Record<TransitionRole, VisitState[] | "*"> = {
  FRONT_DESK: ["ARRIVED", "CHECKED_IN", "CHECKOUT_PENDING", "COMPLETED"],
  ASSISTANT: ["MEDICAL_REVIEWED", "IN_CHAIR"],
  DENTIST: ["EXAM_COMPLETED", "TREATMENT_PLANNED", "TREATED"],
  ADMIN: "*",
}

/** Map existing users.role to transition permission role */
export function getTransitionPermissionRole(userRole: string | null | undefined): TransitionRole | null {
  if (!userRole) return null
  const r = userRole.toLowerCase()
  if (r === "super_admin" || r === "clinic_admin") return "ADMIN"
  if (r === "receptionist" || r === "accountant") return "FRONT_DESK"
  if (r === "hygienist") return "ASSISTANT"
  if (r === "dentist") return "DENTIST"
  return null
}

export interface VisitData {
  flags?: Record<string, boolean>
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
      if (!flags[field]) {
        return { allowed: false, reason: `Missing required field: ${field}` }
      }
    }
  }

  return { allowed: true }
}

/** Ordered steps for the progress panel (exclude SCHEDULED and CANCELLED from main flow) */
export const VISIT_PROGRESS_STEPS: VisitState[] = [
  "ARRIVED",
  "CHECKED_IN",
  "MEDICAL_REVIEWED",
  "IN_CHAIR",
  "EXAM_COMPLETED",
  "TREATMENT_PLANNED",
  "TREATED",
  "CHECKOUT_PENDING",
  "COMPLETED",
]

/** Human-readable labels for visit states */
export const VISIT_STATE_LABELS: Record<VisitState, string> = {
  SCHEDULED: "Scheduled",
  ARRIVED: "Arrived",
  CHECKED_IN: "Checked In",
  MEDICAL_REVIEWED: "Medical Reviewed",
  IN_CHAIR: "In Chair",
  EXAM_COMPLETED: "Exam Completed",
  TREATMENT_PLANNED: "Treatment Planned",
  TREATED: "Treated",
  CHECKOUT_PENDING: "Checkout Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

/** Timestamp key in visit.timestamps for each state (camelCase for JSON) */
export const STATE_TIMESTAMP_KEYS: Record<VisitState, string> = {
  SCHEDULED: "scheduled",
  ARRIVED: "arrived",
  CHECKED_IN: "checkedIn",
  MEDICAL_REVIEWED: "medicalReviewed",
  IN_CHAIR: "inChair",
  EXAM_COMPLETED: "examCompleted",
  TREATMENT_PLANNED: "treatmentPlanned",
  TREATED: "treated",
  CHECKOUT_PENDING: "checkoutPending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
}
