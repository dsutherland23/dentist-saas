"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessPath, getFirstAllowedPath } from "@/lib/permissions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

/**
 * RouteGuard enforces section access control.
 * If the user cannot access the current path, redirects to their first allowed section.
 * Renders a redirecting state instead of protected content to avoid flashing restricted pages.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { profile, isLoading } = useAuth()

    const allowed = canAccessPath(profile, pathname)
    const shouldRedirect = !isLoading && profile && !allowed
    const targetPath = shouldRedirect ? getFirstAllowedPath(profile) : null

    useEffect(() => {
        if (!shouldRedirect || !targetPath || pathname === targetPath) return
        toast.error("You don't have access to this section")
        router.replace(targetPath)
    }, [shouldRedirect, targetPath, pathname, router])

    if (shouldRedirect) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    <span className="text-sm">Redirecting...</span>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
