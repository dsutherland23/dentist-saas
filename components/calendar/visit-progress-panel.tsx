"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  STEP_REQUIREMENTS,
  STATE_TIMESTAMP_KEYS,
  canTransition,
  type VisitState,
} from "@/lib/visit-state-machine"
import {
  getRequiredValidationsForTransition,
  getRequiredFlagsForSpecExpressions,
} from "@/lib/workflow-spec"
import {
  getProgressStepOrderForTemplate,
  getProgressStepOrderFromCustomConfig,
  getStepsForTemplate,
  getStepLabelForTemplate,
  getStepLabelFromCustomConfig,
  type WorkflowTemplateConfig,
} from "@/lib/workflow-templates"
import { Loader2, ExternalLink } from "lucide-react"

export interface VisitForPanel {
  visitId: string
  appointmentId: string
  status: string
  timestamps: Record<string, string>
  flags: Record<string, boolean>
  room: string | null
}

/** Short guide text and link path for each requirement (used in "What to do next") */
const REQUIREMENT_GUIDE: Record<
  string,
  { label: string; path: (patientId: string) => string }
> = {
  insuranceVerified: {
    label: "Verify insurance on patient profile",
    path: (id) => `/patients/${id}`,
  },
  contactConfirmed: {
    label: "Confirm contact details on patient profile",
    path: (id) => `/patients/${id}`,
  },
  consentSigned: {
    label: "Confirm consent is signed (patient profile / forms)",
    path: (id) => `/patients/${id}`,
  },
  medicalHistorySigned: {
    label: "Confirm medical history is signed (patient profile)",
    path: (id) => `/patients/${id}`,
  },
  roomAssigned: {
    label: "Assign a room (appointment / visit)",
    path: () => "/calendar",
  },
  allergiesReviewed: {
    label: "Review allergies (Medical alerts on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  medicationsReviewed: {
    label: "Review medications (Medical alerts on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  clinicalNotesCompleted: {
    label: "Complete clinical notes (Treatments / chart on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  diagnosisEntered: {
    label: "Enter diagnosis (Treatments on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  procedureCodesAdded: {
    label: "Add procedure codes (Treatment plan on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  treatmentPlanSaved: {
    label: "Save treatment plan (Treatment plan on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  costCalculated: {
    label: "Confirm cost (Treatment plan / Billing on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  paymentProcessed: {
    label: "Process payment (Invoice on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  nextAppointmentScheduled: {
    label: "Schedule next appointment (Calendar or New appointment on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  hygieneNotesComplete: {
    label: "Complete hygiene notes (chart / treatments on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  xraysUploaded: {
    label: "Upload X-rays / lab work (patient profile or chart)",
    path: (id) => `/patients/${id}`,
  },
}

/** Guidance for every stage: what to do to move to this step (shown in "What to do next") */
const STEP_GUIDANCE: Partial<Record<VisitState, string>> = {
  READY_FOR_HYGIENE:
    "Assign a room and send the patient to hygiene. Tap Complete when ready.",
  HYGIENE_IN_PROGRESS:
    "Hygiene is in progress. Tap Complete when hygiene is done.",
  HYGIENE_COMPLETED:
    "Hygiene completed. Tap Complete to mark ready for exam.",
  READY_FOR_EXAM:
    "Ensure insurance is verified, medical history and consent are signed, and room is assigned. Use the links below, confirm the boxes, then tap Complete.",
  EXAM_IN_PROGRESS:
    "Exam has started. Complete clinical notes, then tap Complete when treatment plan is ready.",
  TREATMENT_PLANNED:
    "Complete clinical notes and save the treatment plan. Use the links below, check the boxes, then tap Complete.",
  READY_FOR_BILLING:
    "Treatment plan is saved. Tap Complete when the patient is ready for billing.",
  BILLED:
    "Create or confirm the invoice for this patient (e.g. from their profile). Tap Complete when the invoice is ready and payment is recorded.",
  PAYMENT_COMPLETED:
    "Record payment (amount must cover invoice total). Then tap Complete.",
  VISIT_COMPLETED:
    "All steps are complete. Visit is finished.",
}

/** Minimal patient fields from GET /api/patients/[id]/visit-verification */
export interface PatientVerificationData {
  id?: string
  first_name?: string
  last_name?: string
  phone?: string | null
  email?: string | null
  address?: string | null
  insurance_provider?: string | null
  insurance_policy_number?: string | null
  allergies?: string | null
  medical_conditions?: string | null
}

/** Derive which requirement flags are satisfied by existing profile data (auto-verify) */
export function getAutoVerifiedFlagsFromProfile(data: PatientVerificationData | null): Record<string, boolean> {
  if (!data) return {}
  const hasInsurance = !!(data.insurance_provider?.trim() || data.insurance_policy_number?.trim())
  const hasContact = !!(data.phone?.trim() || data.email?.trim())
  // Consider "reviewed" when the field has been set (including empty or "None")
  const hasAllergiesReviewed = data.allergies != null
  const hasMedicationsReviewed = data.medical_conditions != null
  return {
    insuranceVerified: hasInsurance,
    contactConfirmed: hasContact,
    allergiesReviewed: hasAllergiesReviewed,
    medicationsReviewed: hasMedicationsReviewed,
  }
}

interface VisitProgressPanelProps {
  visit: VisitForPanel | null
  onTransition: (nextState: string, flags?: Record<string, boolean>) => void
  userRole?: string | null
  disabled?: boolean
  className?: string
  /** Patient id for "What to do next" shortcut links to profile */
  patientId?: string | null
  /** From GET /api/patients/[id]/visit-verification — used to auto-check requirements when data exists */
  patientVerificationData?: PatientVerificationData | null
  /** When false, consent is not required for Check In (clinic setting) */
  requireConsentInVisitFlow?: boolean
  /** Clinic workflow template (from GET /api/visits); when "custom", use workflowConfig */
  workflowTemplate?: string | null
  /** Custom workflow config (from GET /api/visits when workflowTemplate === "custom") */
  workflowConfig?: WorkflowTemplateConfig | null
}

function formatFlagLabel(key: string): string {
  const withSpaces = key.replace(/([A-Z])/g, " $1").trim()
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase()
}

export function VisitProgressPanel({
  visit,
  onTransition,
  userRole = null,
  disabled = false,
  className = "",
  patientId = null,
  patientVerificationData = null,
  requireConsentInVisitFlow = false,
  workflowTemplate = null,
  workflowConfig = null,
}: VisitProgressPanelProps) {
  const [pendingFlags, setPendingFlags] = useState<Record<string, boolean>>({})

  if (!visit) return null

  const steps = useMemo(() => {
    if (workflowTemplate === "custom" && workflowConfig?.nodes?.length) {
      return getProgressStepOrderFromCustomConfig(workflowConfig)
    }
    return getProgressStepOrderForTemplate(workflowTemplate ?? undefined)
  }, [workflowTemplate, workflowConfig])
  const autoFlagsFromProfile = useMemo(
    () => getAutoVerifiedFlagsFromProfile(patientVerificationData),
    [patientVerificationData]
  )
  const currentIndex = steps.indexOf(visit.status as VisitState)
  const isCancelled = visit.status === "CANCELLED"
  const nextStep = steps[currentIndex + 1] as VisitState | undefined
  const stepDetails = useMemo(
    () =>
      workflowTemplate !== "custom" && (workflowTemplate === "default_clinic_workflow" || workflowTemplate === "full_clinic_workflow")
        ? getStepsForTemplate(workflowTemplate ?? undefined)
        : null,
    [workflowTemplate]
  )
  const nextRequirements = useMemo(() => {
    if (!nextStep) return []
    if (
      (workflowTemplate === "default_clinic_workflow" || workflowTemplate === "full_clinic_workflow") &&
      visit.status
    ) {
      const expressions = getRequiredValidationsForTransition(
        workflowTemplate,
        visit.status as VisitState,
        nextStep
      )
      const { flags } = getRequiredFlagsForSpecExpressions(expressions)
      return flags.filter((r) => requireConsentInVisitFlow || r !== "consentSigned")
    }
    const fromStep = (STEP_REQUIREMENTS[nextStep] ?? []) as string[]
    return fromStep.filter((r) => requireConsentInVisitFlow || r !== "consentSigned")
  }, [nextStep, workflowTemplate, visit.status, requireConsentInVisitFlow])
  const effectiveNextRequirements = nextRequirements
  const mergedFlags = useMemo(
    () => ({
      ...(visit.flags ?? {}),
      ...autoFlagsFromProfile,
      ...pendingFlags,
      ...(visit.room?.trim() ? { roomAssigned: true } : {}),
    }),
    [visit.flags, visit.room, autoFlagsFromProfile, pendingFlags]
  )
  const effectiveFlagsForTransition = useMemo(
    () => (requireConsentInVisitFlow ? mergedFlags : { ...mergedFlags, consentSigned: true }),
    [mergedFlags, requireConsentInVisitFlow]
  )
  const visitDataForTransition = useMemo(
    () => ({ flags: effectiveFlagsForTransition, room: visit.room ?? null }),
    [effectiveFlagsForTransition, visit.room]
  )
  const toggleFlag = (key: string, checked: boolean) => {
    setPendingFlags((prev) => ({ ...prev, [key]: checked }))
  }

  if (isCancelled) {
    return (
      <div className={`w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
        <h3 className="text-sm font-semibold text-slate-900">Visit progress</h3>
        <p className="mt-2 text-sm text-slate-500">Visit was cancelled.</p>
      </div>
    )
  }

  return (
    <div className={`w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Patient visit progress</h3>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex
          const nextStepForAdvance = steps[index + 1]
          const canAdvance =
            nextStepForAdvance &&
            canTransition(visit.status, nextStepForAdvance, visitDataForTransition, userRole ?? undefined).allowed
          const stepCompleted = !!(
            visit.timestamps && STATE_TIMESTAMP_KEYS[step] && (visit.timestamps as Record<string, string>)[STATE_TIMESTAMP_KEYS[step]]
          )
          const stepInfo = stepDetails?.find((s) => s.state === step && (s.subSteps?.length ?? 0) > 0)
          const hasSubSteps = !!(stepInfo?.subSteps && stepInfo.subSteps.length > 0)
          const subStepFlags: Record<string, string> =
            workflowTemplate === "full_clinic_workflow" && step === "READY_FOR_EXAM"
              ? { node_insurance: "insuranceVerified", node_hygiene: "hygieneNotesComplete", node_xray: "xraysUploaded" }
              : {}

          return (
            <div key={`${step}-${index}`} className="space-y-1">
              <div
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                  stepCompleted
                    ? "border-emerald-100 bg-emerald-50/80 text-emerald-800"
                    : isCurrent
                      ? "border-teal-200 bg-teal-50/80 text-teal-900 font-medium"
                      : "border-slate-100 bg-slate-50/80 text-slate-400"
                }`}
              >
                <span className="text-sm">
                  {workflowTemplate === "custom" && workflowConfig
                    ? getStepLabelFromCustomConfig(workflowConfig, step)
                    : getStepLabelForTemplate(step, workflowTemplate ?? undefined)}
                </span>

                {isCurrent && nextStepForAdvance && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white px-2.5"
                    onClick={() => onTransition(nextStepForAdvance, mergedFlags)}
                    disabled={disabled || !canAdvance}
                  >
                    {disabled ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      "Complete"
                    )}
                  </Button>
                )}
              </div>
              {isCurrent && hasSubSteps && stepInfo?.subSteps && (
                <div className="ml-3 pl-3 border-l-2 border-slate-200 space-y-1">
                  {stepInfo.subSteps.map((sub) => {
                    const flagKey = subStepFlags[sub.id]
                    const flags = mergedFlags as Record<string, boolean>
                    const done = flagKey ? !!(flags[flagKey] ?? visit.flags?.[flagKey]) : false
                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center gap-2 text-xs py-1 ${
                          done ? "text-emerald-700" : "text-slate-600"
                        }`}
                      >
                        <span className={done ? "opacity-80" : ""}>{sub.label}</span>
                        {done && <span className="text-emerald-600 font-medium">Done</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {visit.room && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-sm text-slate-500">
          Room: {visit.room}
        </div>
      )}

      {/* What to do next: shown for every stage with step-specific guidance */}
      {nextStep && STEP_GUIDANCE[nextStep] && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-1.5">What to do next</p>
          <p className="text-[11px] text-slate-600 mb-3">
            {STEP_GUIDANCE[nextStep]}
          </p>
          {effectiveNextRequirements.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Before{" "}
                {workflowTemplate === "custom" && workflowConfig
                  ? getStepLabelFromCustomConfig(workflowConfig, nextStep)
                  : getStepLabelForTemplate(nextStep, workflowTemplate ?? undefined)}{" "}
                — quick links
              </p>
              <ul className="space-y-1.5 mb-3">
                {effectiveNextRequirements.map((key) => {
                  const guide = REQUIREMENT_GUIDE[key]
                  const label = guide?.label ?? formatFlagLabel(key)
                  const href = patientId && guide ? guide.path(patientId) : null
                  return (
                    <li key={key} className="flex items-center gap-2 text-xs text-slate-700">
                      {href ? (
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 underline"
                        >
                          {label}
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                        </Link>
                      ) : (
                        <span>{label}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs font-medium text-slate-600 mb-2">Confirm and complete</p>
              <div className="space-y-2">
                {effectiveNextRequirements.map((key) => {
                  if (key === "roomAssigned") {
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm text-slate-700">
                        <Checkbox checked={!!visit.room?.trim()} disabled />
                        <span className="flex-1">{formatFlagLabel(key)}</span>
                        {visit.room?.trim() ? (
                          <span className="text-[10px] text-emerald-600 font-medium">Set</span>
                        ) : (
                          <Link href="/calendar" className="text-[10px] text-teal-600 hover:underline">
                            Set room
                          </Link>
                        )}
                      </div>
                    )
                  }
                  const flagsMap = mergedFlags as Record<string, boolean>
                  const autoMap = autoFlagsFromProfile as Record<string, boolean>
                  const fromProfile = !!(flagsMap[key] && autoMap[key])
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <Checkbox
                        checked={flagsMap[key] ?? false}
                        onCheckedChange={(checked) => toggleFlag(key, checked === true)}
                        disabled={disabled}
                      />
                      <span className="flex-1">{formatFlagLabel(key)}</span>
                      {fromProfile && (
                        <span className="text-[10px] text-emerald-600 font-medium shrink-0">From profile</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
