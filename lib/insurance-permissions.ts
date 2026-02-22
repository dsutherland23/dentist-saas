/**
 * Insurance module role-based permissions.
 * Maps spec roles to existing app roles: Admin → clinic_admin/super_admin;
 * FrontDesk → receptionist; Dentist → dentist; Billing → accountant.
 */

export const INSURANCE_ROLES = {
    create_edit_insurance: ["super_admin", "clinic_admin", "receptionist"],
    verify_eligibility: ["super_admin", "clinic_admin", "receptionist"],
    submit_claim: ["super_admin", "clinic_admin", "accountant", "receptionist"],
    process_era: ["super_admin", "clinic_admin", "accountant"],
    view_eligibility: ["super_admin", "clinic_admin", "receptionist", "dentist", "accountant"],
    view_estimator: ["super_admin", "clinic_admin", "receptionist", "dentist"],
} as const

const includesRole = (roles: readonly string[], role: string) => roles.includes(role)

export function canCreateEditInsurance(role: string): boolean {
    return includesRole(INSURANCE_ROLES.create_edit_insurance, role)
}

export function canVerifyEligibility(role: string): boolean {
    return includesRole(INSURANCE_ROLES.verify_eligibility, role)
}

export function canSubmitClaim(role: string): boolean {
    return includesRole(INSURANCE_ROLES.submit_claim, role)
}

export function canViewEstimator(role: string): boolean {
    return includesRole(INSURANCE_ROLES.view_estimator, role)
}
