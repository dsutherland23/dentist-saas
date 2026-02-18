"use client"

import { Purchases } from "@revenuecat/purchases-js"
import type { CustomerInfo } from "@revenuecat/purchases-js"

/** Entitlement identifier for Dental Clinic Pro (configure same in RevenueCat dashboard). */
export const PRO_ENTITLEMENT_ID = "pro"

let purchasesInstance: Purchases | null = null

export function getRevenueCatPurchases(): Purchases {
  if (!purchasesInstance) {
    throw new Error("RevenueCat not configured. Call configureRevenueCat(appUserId) first.")
  }
  return purchasesInstance
}

/**
 * Configure RevenueCat once per app load. Call after user is authenticated.
 * Use a stable ID (e.g. Supabase user.id or clinic_id for clinic-wide subscription).
 */
export async function configureRevenueCat(appUserId: string): Promise<Purchases> {
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_REVENUECAT_API_KEY is not set")
  }

  if (purchasesInstance) {
    return purchasesInstance
  }

  purchasesInstance = Purchases.configure(apiKey, appUserId)
  return purchasesInstance
}

export function isRevenueCatConfigured(): boolean {
  return purchasesInstance != null
}

export type EntitlementStatus = "unknown" | "entitled" | "not_entitled"

/** Check if the current user has the Pro entitlement. */
export async function checkProEntitlement(): Promise<EntitlementStatus> {
  try {
    const purchases = getRevenueCatPurchases()
    const isEntitled = await purchases.isEntitledTo(PRO_ENTITLEMENT_ID)
    return isEntitled ? "entitled" : "not_entitled"
  } catch (e) {
    console.error("RevenueCat entitlement check error", e)
    return "unknown"
  }
}

/** Get customer info (entitlements, management URL, etc.). */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const purchases = getRevenueCatPurchases()
    return await purchases.getCustomerInfo()
  } catch (e) {
    console.error("RevenueCat getCustomerInfo error", e)
    return null
  }
}

/** App pricing (for display). Configure products in RevenueCat with these values. */
export const PRICING = {
  monthly: { price: 150, currency: "USD", label: "$150", period: "/month" },
  yearly: { price: 1000, currency: "USD", label: "$1,000", period: "/year" },
  lifetime: { price: 5000, currency: "USD", label: "$5,000", period: " one-time" },
} as const
