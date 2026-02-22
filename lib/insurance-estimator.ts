/**
 * Insurance estimator engine.
 * Inputs: procedure_fee, coverage_percentage, deductible_remaining, annual_max_remaining.
 * Logic: Apply deductible, then coverage percentage, cap by annual_max_remaining.
 * Outputs: insurance_estimate, patient_portion.
 */

export interface EstimatorInput {
    procedure_code?: string
    procedure_fee: number
    coverage_percentage: number
    deductible_remaining: number
    annual_max_remaining: number
}

export interface EstimatorOutput {
    insurance_estimate: number
    patient_portion: number
    applied_deductible: number
    applied_coverage: number
    capped_by_annual_max: boolean
}

/**
 * Apply deductible first (patient pays until deductible is met), then apply coverage percentage
 * to the remainder. Cap insurance payout by annual_max_remaining.
 */
export function estimateInsurance(input: EstimatorInput): EstimatorOutput {
    const {
        procedure_fee,
        coverage_percentage,
        deductible_remaining,
        annual_max_remaining,
    } = input

    const fee = Math.max(0, Number(procedure_fee))
    const pct = Math.max(0, Math.min(100, Number(coverage_percentage))) / 100
    let deductRem = Math.max(0, Number(deductible_remaining))
    let maxRem = Math.max(0, Number(annual_max_remaining))

    let applied_deductible = 0
    if (deductRem > 0 && fee > 0) {
        applied_deductible = Math.min(fee, deductRem)
    }
    const afterDeductible = fee - applied_deductible
    let insurance_estimate = afterDeductible * pct
    if (maxRem >= 0) {
        const capped = Math.min(insurance_estimate, maxRem)
        insurance_estimate = capped
    }
    const patient_portion = fee - insurance_estimate
    const capped_by_annual_max = maxRem >= 0 && afterDeductible * pct > insurance_estimate

    return {
        insurance_estimate: Math.round(insurance_estimate * 100) / 100,
        patient_portion: Math.round(patient_portion * 100) / 100,
        applied_deductible,
        applied_coverage: insurance_estimate,
        capped_by_annual_max,
    }
}
