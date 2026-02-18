"use client"

import { useState, useEffect, useCallback } from "react"
import type { CustomerInfo } from "@revenuecat/purchases-js"
import {
  configureRevenueCat,
  getRevenueCatPurchases,
  checkProEntitlement,
  isRevenueCatConfigured,
  type EntitlementStatus,
} from "@/lib/revenuecat"

export function useRevenueCat(userId: string | undefined) {
  const [entitlementStatus, setEntitlementStatus] = useState<EntitlementStatus>("unknown")
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setEntitlementStatus("not_entitled")
      setCustomerInfo(null)
      return
    }
    setLoading(true)
    try {
      if (!isRevenueCatConfigured()) {
        await configureRevenueCat(userId)
      }
      const status = await checkProEntitlement()
      setEntitlementStatus(status)
      const purchases = getRevenueCatPurchases()
      const info = await purchases.getCustomerInfo()
      setCustomerInfo(info)
    } catch (e) {
      console.error("useRevenueCat refresh error", e)
      setEntitlementStatus("unknown")
      setCustomerInfo(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entitlementStatus, customerInfo, loading, refresh, isPro: entitlementStatus === "entitled" }
}
