"use client"

import { useState, useEffect, useCallback } from "react"
import {
  isOnline as getIsOnline,
  getPendingCount,
  enqueueVisitTransition,
  syncQueue,
  type QueuedVisitTransition,
} from "@/lib/offline-queue"

/**
 * Hook for offline visit transition queue: pending count, enqueue, and auto-sync on reconnect.
 */
export function useOfflineVisitQueue() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPending = useCallback(async () => {
    try {
      const n = await getPendingCount()
      setPendingCount(n)
    } catch {
      setPendingCount(0)
    }
  }, [])

  useEffect(() => {
    setOnline(getIsOnline())
    refreshPending()

    const handleOnline = () => {
      setOnline(true)
      syncQueue(fetch).then(({ synced }) => {
        if (synced > 0) refreshPending()
      })
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [refreshPending])

  const enqueueTransition = useCallback(
    async (payload: QueuedVisitTransition["payload"]) => {
      const entry = await enqueueVisitTransition(payload)
      await refreshPending()
      return entry
    },
    [refreshPending]
  )

  const syncNow = useCallback(async () => {
    const result = await syncQueue(fetch)
    await refreshPending()
    return result
  }, [refreshPending])

  return {
    isOnline: online,
    pendingCount,
    enqueueTransition,
    syncNow,
    refreshPending,
  }
}
