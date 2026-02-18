"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRevenueCat } from "@/lib/hooks/use-revenuecat"

type TrialState = {
  loading: boolean
  isPro: boolean
  isTrialActive: boolean
  isTrialExpired: boolean
  trialDaysLeft: number | null
}

const TRIAL_LENGTH_DAYS = 7

export function useTrialLock(): TrialState {
  const { user } = useAuth()
  const { isPro, loading: rcLoading } = useRevenueCat(user?.id)

  const { loading, isTrialActive, isTrialExpired, trialDaysLeft } = useMemo(() => {
    if (!user || !user.created_at) {
      return {
        loading: rcLoading,
        isTrialActive: false,
        isTrialExpired: false,
        trialDaysLeft: null,
      }
    }

    const createdAt = new Date(user.created_at)
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const remaining = TRIAL_LENGTH_DAYS - diffDays

    if (remaining > 0) {
      return {
        loading: rcLoading,
        isTrialActive: true,
        isTrialExpired: false,
        trialDaysLeft: remaining,
      }
    }

    return {
      loading: rcLoading,
      isTrialActive: false,
      isTrialExpired: true,
      trialDaysLeft: 0,
    }
  }, [user, rcLoading])

  return {
    loading,
    isPro,
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
  }
}

