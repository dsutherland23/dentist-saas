"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTrialLock } from "@/lib/hooks/use-trial-lock"

export function TrialGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, isPro, isTrialExpired } = useTrialLock()

  const isSettingsPath = pathname.startsWith("/settings")

  const shouldLock = !loading && !isPro && isTrialExpired && !isSettingsPath

  useEffect(() => {
    if (!shouldLock) return
    toast.error("Your 7‑day trial has ended. Please subscribe to continue using the app.")
    router.replace("/settings")
  }, [shouldLock, router])

  if (loading || shouldLock) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-sm">
            {loading ? "Checking subscription…" : "Redirecting to billing…"}
          </span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

