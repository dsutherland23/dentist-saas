/**
 * Shared branding for receipts, referral messages, and printable documents.
 * Header = clinic logo, name, contact, website.
 * Footer = webapp name + "Created by Dental Clinic Pro".
 */

export const APP_NAME = "Dental Clinic Pro"
export const CREATED_BY = "Created by Dental Clinic Pro"

export interface ClinicBranding {
    name: string
    logo_url?: string | null
    phone?: string | null
    website?: string | null
    address?: string | null
    email?: string | null
}

/** Plain-text header line for referral email/WhatsApp (e.g. "Clinic Name | https://...") */
export function referralMessageHeader(clinic: ClinicBranding | null): string {
    if (!clinic?.name) return ""
    const parts = [clinic.name]
    if (clinic.website?.trim()) parts.push(clinic.website.trim())
    if (clinic.phone?.trim()) parts.push(clinic.phone.trim())
    return parts.join(" | ") + "\n\n"
}

/** Plain-text footer for referral email/WhatsApp */
export function referralMessageFooter(): string {
    return `\n\n— ${APP_NAME} (${CREATED_BY})`
}

/** Build full referral body with optional clinic header and standard footer */
export function buildReferralMessageBody(
    bodyContent: string,
    clinic: ClinicBranding | null
): string {
    const header = referralMessageHeader(clinic)
    const footer = referralMessageFooter()
    return header + bodyContent.trim() + footer
}

/**
 * Build a professional, well-structured email body for sending the specialist
 * referral intake link. The recipient can use the link to enter their details
 * and pin their practice location on a map.
 */
export function buildReferralIntakeEmailContent(
    intakeLink: string,
    clinic: ClinicBranding | null
): string {
    const header = referralMessageHeader(clinic)
    const body = [
        "Dear Colleague,",
        "",
        "We would like to connect with you regarding a patient referral. To complete the process, we need your practice details and location so we can add you to our referral network.",
        "",
        "Please use the secure link below to:",
        "  • Enter your practice name, address, and contact information",
        "  • Pin your practice location on the map (or use your device’s location)",
        "  • Confirm your specialty",
        "",
        "This one-time link will take you to a short, secure form:",
        "",
        intakeLink,
        "",
        "Important: This link expires in 48 hours and can only be used once. If the link has expired, please contact us to receive a new one.",
        "",
        "Thank you for your collaboration.",
    ].join("\n")
    const footer = referralMessageFooter()
    return header + body + footer
}

/** Subject line for referral intake emails */
export const REFERRAL_INTAKE_EMAIL_SUBJECT = "Patient referral – confirm your practice details (one-time link)"
