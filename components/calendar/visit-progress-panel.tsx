"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  VISIT_PROGRESS_STEPS,
  VISIT_STATE_LABELS,
  STEP_REQUIREMENTS,
  canTransition,
  type VisitState,
} from "@/lib/visit-state-machine"
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
  allergiesReviewed: {
    label: "Review allergies (Medical alerts on patient profile)",
    path: (id) => `/patients/${id}`,
  },
  medicationsReviewed: {
    label: "Review medications (Medical alerts on patient profile)",
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
}

/** Guidance for every stage: what to do to move to this step (shown in "What to do next") */
const STEP_GUIDANCE: Partial<Record<VisitState, string>> = {
  CHECKED_IN:
    "Verify insurance, contact details, and consent (if required). Use the links below to open the patient profile, then check the boxes and tap Complete.",
  MEDICAL_REVIEWED:
    "Review allergies and medications on the patient profile. Use the links below, confirm the boxes, then tap Complete.",
  IN_CHAIR:
    "Bring the patient to the chair. When ready, tap Complete to mark In Chair.",
  EXAM_COMPLETED:
    "Complete the exam and enter diagnosis in the patient's treatments. Use the link below, check the box, then tap Complete.",
  TREATMENT_PLANNED:
    "Add procedure codes and cost on the treatment plan. Use the links below, check the boxes, then tap Complete.",
  TREATED:
    "Treatment is done. Tap Complete to mark Treated, then move to Checkout pending when the patient is ready to pay.",
  CHECKOUT_PENDING:
    "Process payment and schedule the next appointment. Use the links below, check the boxes, then tap Complete to finish the visit.",
  COMPLETED:
    "All steps are complete. Process payment and schedule the next visit if needed, then tap Complete.",
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
}: VisitProgressPanelProps) {
  const [pendingFlags, setPendingFlags] = useState<Record<string, boolean>>({})

  if (!visit) return null

  const autoFlagsFromProfile = useMemo(
    () => getAutoVerifiedFlagsFromProfile(patientVerificationData),
    [patientVerificationData]
  )
  const currentIndex = VISIT_PROGRESS_STEPS.indexOf(visit.status as VisitState)
  const isCancelled = visit.status === "CANCELLED"
  const nextStep = VISIT_PROGRESS_STEPS[currentIndex + 1] as VisitState | undefined
  const nextRequirements = (nextStep ? STEP_REQUIREMENTS[nextStep] : undefined) ?? []
  const effectiveNextRequirements = useMemo(
    () => nextRequirements.filter((r) => requireConsentInVisitFlow || r !== "consentSigned"),
    [nextRequirements, requireConsentInVisitFlow]
  )
  const mergedFlags = useMemo(
    () => ({ ...(visit.flags ?? {}), ...autoFlagsFromProfile, ...pendingFlags }),
    [visit.flags, autoFlagsFromProfile, pendingFlags]
  )
  const effectiveFlagsForTransition = useMemo(
    () => (requireConsentInVisitFlow ? mergedFlags : { ...mergedFlags, consentSigned: true }),
    [mergedFlags, requireConsentInVisitFlow]
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

  const steps = VISIT_PROGRESS_STEPS

  return (
    <div className={`w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Patient visit progress</h3>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const nextStep = steps[index + 1]
          const canAdvance =
            nextStep &&
            canTransition(visit.status, nextStep, { flags: effectiveFlagsForTransition }, userRole ?? undefined).allowed

          return (
            <div
              key={step}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                isCompleted
                  ? "border-emerald-100 bg-emerald-50/80 text-emerald-800"
                  : isCurrent
                    ? "border-teal-200 bg-teal-50/80 text-teal-900 font-medium"
                    : "border-slate-100 bg-slate-50/80 text-slate-400"
              }`}
            >
              <span className="text-sm">{VISIT_STATE_LABELS[step]}</span>

              {isCurrent && nextStep && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white px-2.5"
                  onClick={() => onTransition(nextStep, mergedFlags)}
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
                Before {VISIT_STATE_LABELS[nextStep]} — quick links
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
                  const fromProfile = !!(mergedFlags[key] && autoFlagsFromProfile[key])
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <Checkbox
                        checked={mergedFlags[key] ?? false}
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
