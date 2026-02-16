"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessPath, getFirstAllowedPath } from "@/lib/permissions"
import { toast } from "sonner"

/**
 * RouteGuard enforces section access control.
 * If the user cannot access the current path, redirects to their first allowed section
 * (e.g. receptionist with dashboard disabled goes to calendar or patients, not dashboard).
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { profile, isLoading } = useAuth()

    useEffect(() => {
        if (isLoading || !profile) return

        if (!canAccessPath(profile, pathname)) {
            const target = getFirstAllowedPath(profile)
            if (pathname !== target) {
                toast.error("You don't have access to this section")
                router.replace(target)
            }
        }
    }, [pathname, profile, isLoading, router])

    return <>{children}</>
}
