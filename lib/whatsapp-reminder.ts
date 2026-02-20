/**
 * WhatsApp reminder utilities for appointment reminders.
 * Builds pre-filled messages and generates wa.me URLs (no API calls, just URL generation).
 */

/**
 * Normalize phone number for WhatsApp wa.me links.
 * Strips non-digits and optionally adds default country code.
 * 
 * @param phone - Raw phone string (e.g. "+1 876-555-1234" or "8765551234")
 * @param defaultCountryCode - Optional default country code (e.g. "1" for US). If phone is 10 digits, prepends this.
 * @returns Normalized digits-only string with country code, or empty string if invalid
 */
export function normalizePhoneForWhatsApp(phone: string, defaultCountryCode: string = "1"): string {
    if (!phone) return ""
    
    // Strip all non-digits
    const digits = phone.replace(/\D/g, "")
    
    if (!digits) return ""
    
    // If 10 digits and we have a default country code, prepend it
    if (digits.length === 10 && defaultCountryCode) {
        return `${defaultCountryCode}${digits}`
    }
    
    // If already has country code (11+ digits) or other format, return as-is
    // wa.me accepts numbers with country code (no + sign)
    return digits
}

/**
 * Build appointment reminder message text.
 * 
 * @param patientName - Patient's full name
 * @param clinicName - Clinic name
 * @param treatment - Treatment/appointment type
 * @param dentistName - Dentist/provider name
 * @param dateStr - Formatted date string (e.g. "May 30, 2025")
 * @param timeStr - Formatted time string (e.g. "11:00 AM")
 * @param clinicPhone - Optional clinic phone for contact info
 * @returns Formatted reminder message
 */
export function buildReminderMessage(
    patientName: string,
    clinicName: string,
    treatment: string,
    dentistName: string,
    dateStr: string,
    timeStr: string,
    clinicPhone?: string | null
): string {
    const parts = [
        `Hi ${patientName}, this is ${clinicName}.`,
        "",
        `Your dental appointment for ${treatment} with ${dentistName} is scheduled for ${dateStr} at ${timeStr}.`,
        "",
        "Please confirm or call us if you need to reschedule.",
    ]
    
    if (clinicPhone) {
        parts.push("", `Call us at ${clinicPhone} if you have any questions.`)
    }
    
    return parts.join("\n")
}

/**
 * Generate WhatsApp wa.me URL with pre-filled message.
 * 
 * @param phone - Patient phone number (will be normalized)
 * @param message - Message text to pre-fill
 * @param defaultCountryCode - Optional default country code for normalization
 * @returns WhatsApp URL or empty string if phone is invalid
 */
export function getWhatsAppReminderUrl(
    phone: string,
    message: string,
    defaultCountryCode: string = "1"
): string {
    const normalized = normalizePhoneForWhatsApp(phone, defaultCountryCode)
    
    if (!normalized || normalized.length < 10) {
        return ""
    }
    
    // wa.me/{number}?text={encoded_message}
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
