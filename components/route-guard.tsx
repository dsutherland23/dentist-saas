"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessPath } from "@/lib/permissions"
import { toast } from "sonner"

/**
 * RouteGuard component that enforces section access control
 * Redirects users to /dashboard if they try to access a restricted section
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { profile, isLoading } = useAuth()

    useEffect(() => {
        // Don't check while loading
        if (isLoading || !profile) return

        // Check if user can access current path
        if (!canAccessPath(profile, pathname)) {
            console.warn(`[RouteGuard] Access denied to ${pathname} for user ${profile.id}`)
            toast.error("You don't have access to this section")
            router.replace("/dashboard")
        }
    }, [pathname, profile, isLoading, router])

    return <>{children}</>
}
