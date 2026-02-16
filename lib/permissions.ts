/**
 * Permission helpers for access control and limit enforcement
 */

import { getSectionByKey, getSectionByPath, SECTIONS } from "./access-config"

export interface UserProfile {
    id: string
    clinic_id: string
    role: string
    allowed_sections?: string[] | null
    limits?: Record<string, number> | null
    [key: string]: any
}

/**
 * Get the first path the user is allowed to access (for post-login or denied redirect).
 * If user has no restrictions, returns /dashboard. Otherwise returns the first allowed section path in order.
 */
export function getFirstAllowedPath(profile: UserProfile | null): string {
    if (!profile) return "/dashboard"
    if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
        return "/dashboard"
    }
    const allowed = profile.allowed_sections
    const first = SECTIONS.find(s => allowed.includes(s.key))
    return first?.path ?? "/dashboard"
}

/**
 * Check if a user can access a specific section
 * @param profile User profile with allowed_sections
 * @param sectionKey Section key to check (e.g., "dashboard", "patients")
 * @returns true if user has access, false otherwise
 */
export function canAccessSection(profile: UserProfile | null, sectionKey: string): boolean {
    if (!profile) return false
    
    // null or empty array = full access (backward compatible)
    if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
        return true
    }
    
    // Check if section is in allowed list
    return profile.allowed_sections.includes(sectionKey)
}

/**
 * Check if a user can access a specific path
 * @param profile User profile with allowed_sections
 * @param path Path to check (e.g., "/dashboard", "/patients/123")
 * @returns true if user has access, false otherwise
 */
export function canAccessPath(profile: UserProfile | null, path: string): boolean {
    if (!profile) return false
    
    // null or empty array = full access
    if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
        return true
    }
    
    // Find section by path
    const section = getSectionByPath(path)
    if (!section) {
        // Unknown path, fail closed
        return false
    }
    
    return profile.allowed_sections.includes(section.key)
}

/**
 * Get user's limit for a specific resource
 * @param profile User profile with limits
 * @param limitKey Limit key (e.g., "patients", "appointments_per_month")
 * @returns Limit value or null if unlimited
 */
export function getLimit(profile: UserProfile | null, limitKey: string): number | null {
    if (!profile?.limits) return null
    
    const limit = profile.limits[limitKey]
    return typeof limit === 'number' ? limit : null
}

/**
 * Check if user has reached a limit
 * @param profile User profile with limits
 * @param limitKey Limit key to check
 * @param currentCount Current count of the resource
 * @returns true if limit is reached, false if still has capacity or no limit
 */
export function isLimitReached(
    profile: UserProfile | null,
    limitKey: string,
    currentCount: number
): boolean {
    const limit = getLimit(profile, limitKey)
    
    // No limit defined = unlimited
    if (limit === null) return false
    
    return currentCount >= limit
}

/**
 * Check if user can perform an admin action (invite users, change settings, etc.)
 * @param profile User profile
 * @returns true if user is an admin
 */
export function canInviteUsers(profile: UserProfile | null): boolean {
    if (!profile) return false
    return profile.role === 'clinic_admin' || profile.role === 'super_admin'
}

/**
 * Filter sections based on user's allowed_sections
 * @param profile User profile
 * @param sectionKeys Array of section keys to filter
 * @returns Filtered array containing only allowed section keys
 */
export function filterAllowedSections(
    profile: UserProfile | null,
    sectionKeys: string[]
): string[] {
    if (!profile) return []
    
    // null or empty = all sections allowed
    if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
        return sectionKeys
    }
    
    return sectionKeys.filter(key => profile.allowed_sections!.includes(key))
}

/**
 * Get sections that user cannot access
 * @param profile User profile
 * @param allSectionKeys Array of all section keys
 * @returns Array of section keys the user cannot access
 */
export function getRestrictedSections(
    profile: UserProfile | null,
    allSectionKeys: string[]
): string[] {
    if (!profile) return allSectionKeys
    
    // null or empty = no restrictions
    if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
        return []
    }
    
    return allSectionKeys.filter(key => !profile.allowed_sections!.includes(key))
}
