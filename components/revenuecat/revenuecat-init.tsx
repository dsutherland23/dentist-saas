"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { configureRevenueCat, isRevenueCatConfigured } from "@/lib/revenuecat"

/**
 * Configures RevenueCat when the user is authenticated. Mount once inside dashboard layout.
 */
export function RevenueCatInit() {
  const { user } = useAuth()
  const configured = useRef(false)

  useEffect(() => {
    if (!user?.id || configured.current) return
    if (isRevenueCatConfigured()) {
      configured.current = true
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY
    if (!apiKey) return

    configureRevenueCat(user.id)
      .then(() => {
        configured.current = true
      })
      .catch((e) => {
        console.error("RevenueCat configure error", e)
      })
  }, [user?.id])

  return null
}
