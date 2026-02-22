/**
 * Offline action queue (Dynamic Patient Visit Workflow 2.0).
 * Queues visit transitions when offline; syncs on reconnect (last-write-wins).
 * Uses IndexedDB via idb; payloads encrypted at rest when available (Phase 3).
 */

import { openDB, type IDBPDatabase } from "idb"
import { encryptQueuePayload, decryptQueuePayload, isEncryptionAvailable } from "./offline-queue-crypto"

const DB_NAME = "dentist-saas-offline"
const STORE_NAME = "visit-transition-queue"
const DB_VERSION = 1

export type QueuedVisitTransitionPayload = {
  appointmentId: string
  nextState: string
  flags?: Record<string, boolean>
}

export type QueuedVisitTransition = {
  id: string
  type: "visit_transition"
  payload: QueuedVisitTransitionPayload
  createdAt: string
  syncedAt?: string | null
}

/** Stored row: payload may be legacy plain or encrypted via encryptedPayload */
type StoredQueueEntry = Omit<QueuedVisitTransition, "payload"> & {
  payload?: QueuedVisitTransitionPayload
  encryptedPayload?: string
}

type QueueSchema = {
  [STORE_NAME]: { key: string; value: StoredQueueEntry; indexes: { byCreated: string; bySynced: string } }
}

let dbPromise: Promise<IDBPDatabase<QueueSchema>> | null = null

function getDB(): Promise<IDBPDatabase<QueueSchema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Offline queue is only available in the browser"))
  }
  if (!dbPromise) {
    dbPromise = openDB<QueueSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("byCreated", "createdAt")
        store.createIndex("bySynced", "syncedAt")
      },
    })
  }
  return dbPromise
}

/** Generate a unique id for a queued action */
export function generateQueueId(): string {
  return `qt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Add a visit transition to the queue (e.g. when offline). Payload encrypted at rest when available. */
export async function enqueueVisitTransition(
  payload: QueuedVisitTransitionPayload
): Promise<QueuedVisitTransition> {
  const db = await getDB()
  const id = generateQueueId()
  const createdAt = new Date().toISOString()
  const stored: StoredQueueEntry = {
    id,
    type: "visit_transition",
    createdAt,
  }
  if (isEncryptionAvailable()) {
    try {
      const encrypted = await encryptQueuePayload(JSON.stringify(payload))
      if (encrypted) stored.encryptedPayload = encrypted
      else stored.payload = payload
    } catch {
      stored.payload = payload
    }
  } else {
    stored.payload = payload
  }
  await db.put(STORE_NAME, stored)
  return { id, type: "visit_transition", payload, createdAt }
}

/** Resolve payload from stored entry (decrypt if encrypted). */
async function resolvePayload(entry: StoredQueueEntry): Promise<QueuedVisitTransitionPayload | null> {
  if (entry.payload) return entry.payload
  if (entry.encryptedPayload) {
    const raw = await decryptQueuePayload(entry.encryptedPayload)
    if (raw) {
      try {
        return JSON.parse(raw) as QueuedVisitTransitionPayload
      } catch {
        return null
      }
    }
  }
  return null
}

/** Get all pending (unsynced) actions in creation order. Payloads decrypted when encrypted. */
export async function getPendingActions(): Promise<QueuedVisitTransition[]> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, "readonly")
  const index = tx.store.index("byCreated")
  const all = await index.getAll()
  const pending = all.filter((a) => a.syncedAt == null).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const out: QueuedVisitTransition[] = []
  for (const entry of pending) {
    const payload = await resolvePayload(entry)
    if (payload) out.push({ id: entry.id, type: entry.type, payload, createdAt: entry.createdAt, syncedAt: entry.syncedAt })
  }
  return out
}

/** Get count of pending actions (for UI "Pending sync" badge) */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingActions()
  return pending.length
}

/** Mark an action as synced (after successful API call) */
export async function markSynced(id: string): Promise<void> {
  const db = await getDB()
  const entry = await db.get(STORE_NAME, id)
  if (entry) {
    const updated: StoredQueueEntry = { ...entry, syncedAt: new Date().toISOString() }
    await db.put(STORE_NAME, updated)
  }
}

/** Remove synced entries older than 24h to avoid unbounded growth */
export async function clearOldSyncedEntries(): Promise<void> {
  const db = await getDB()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const tx = db.transaction(STORE_NAME, "readwrite")
  const all = await tx.store.getAll() as StoredQueueEntry[]
  for (const entry of all) {
    if (entry.syncedAt && entry.syncedAt < cutoff) {
      await tx.store.delete(entry.id)
    }
  }
  await tx.done
}

/** Drain the queue: run each pending action via API, last-write-wins (no conflict UI). */
export async function syncQueue(
  fetchFn: (url: string, options: RequestInit) => Promise<Response>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingActions()
  let synced = 0
  let failed = 0
  for (const action of pending) {
    if (action.type !== "visit_transition") continue
    try {
      const res = await fetchFn("/api/visits/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: action.payload.appointmentId,
          nextState: action.payload.nextState,
          flags: action.payload.flags,
        }),
      })
      if (res.ok) {
        await markSynced(action.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }
  if (synced > 0) await clearOldSyncedEntries()
  return { synced, failed }
}

/** Check if the app is considered online (navigator.onLine) */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}
