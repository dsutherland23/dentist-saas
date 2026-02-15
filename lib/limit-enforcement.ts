/**
 * Server-side limit enforcement utilities
 * Use these in API routes to enforce usage limits
 */

import { createClient } from "@/lib/supabase-server"
import { getLimit, isLimitReached } from "./permissions"
import type { UserProfile } from "./permissions"

/**
 * Check if a user has reached their limit for a specific resource
 * Returns { allowed: boolean, message?: string, limit?: number, current?: number }
 */
export async function checkLimit(
    userId: string,
    limitKey: string,
    additionalCount: number = 1
): Promise<{
    allowed: boolean
    message?: string
    limit?: number
    current?: number
}> {
    try {
        const supabase = await createClient()

        // Get user profile with limits
        const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("id, clinic_id, role, allowed_sections, limits")
            .eq("id", userId)
            .single()

        if (profileError || !profile) {
            return { allowed: false, message: "User not found" }
        }

        const userProfile = profile as UserProfile
        const limit = getLimit(userProfile, limitKey)

        // No limit = unlimited
        if (limit === null) {
            return { allowed: true }
        }

        // Get current count based on limit type
        let currentCount = 0

        switch (limitKey) {
            case "patients": {
                const { count, error } = await supabase
                    .from("patients")
                    .select("*", { count: "exact", head: true })
                    .eq("clinic_id", profile.clinic_id)

                if (error) {
                    console.error("[CHECK_LIMIT] Error counting patients:", error)
                    return { allowed: false, message: "Failed to check limit" }
                }

                currentCount = count || 0
                break
            }

            case "appointments_per_month": {
                // Get start and end of current month
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

                const { count, error } = await supabase
                    .from("appointments")
                    .select("*", { count: "exact", head: true })
                    .eq("clinic_id", profile.clinic_id)
                    .gte("start_time", startOfMonth)
                    .lte("start_time", endOfMonth)

                if (error) {
                    console.error("[CHECK_LIMIT] Error counting appointments:", error)
                    return { allowed: false, message: "Failed to check limit" }
                }

                currentCount = count || 0
                break
            }

            default:
                // Unknown limit type, allow by default
                return { allowed: true }
        }

        // Check if adding the new items would exceed the limit
        const wouldExceed = (currentCount + additionalCount) > limit

        if (wouldExceed) {
            return {
                allowed: false,
                message: `${getLimitLabel(limitKey)} limit reached (${currentCount}/${limit})`,
                limit,
                current: currentCount
            }
        }

        return {
            allowed: true,
            limit,
            current: currentCount
        }
    } catch (error) {
        console.error("[CHECK_LIMIT] Error:", error)
        return { allowed: false, message: "Failed to check limit" }
    }
}

/**
 * Get a human-readable label for a limit key
 */
function getLimitLabel(limitKey: string): string {
    const labels: Record<string, string> = {
        patients: "Patient",
        appointments_per_month: "Monthly appointment"
    }
    return labels[limitKey] || limitKey
}

/**
 * Middleware-style limit check that returns a NextResponse if limit is exceeded
 * Returns null if the limit check passes
 */
export async function enforceLimitMiddleware(
    userId: string,
    limitKey: string,
    additionalCount: number = 1
): Promise<Response | null> {
    const result = await checkLimit(userId, limitKey, additionalCount)

    if (!result.allowed) {
        const { NextResponse } = await import("next/server")
        return NextResponse.json(
            {
                error: result.message || "Limit exceeded",
                limit: result.limit,
                current: result.current
            },
            { status: 403 }
        )
    }

    return null
}
