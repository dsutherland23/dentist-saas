/**
 * Encryption for offline queue payloads (Dynamic Patient Visit Workflow 2.0 – Phase 3).
 * Uses Web Crypto API (AES-GCM). Key is stored in sessionStorage per origin.
 */

const QUEUE_KEY_STORAGE = "dentist_saas_offline_queue_key"
const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12

function getKeyStorage(): string | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null
  return window.sessionStorage.getItem(QUEUE_KEY_STORAGE)
}

function setKeyStorage(hex: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return
  window.sessionStorage.setItem(QUEUE_KEY_STORAGE, hex)
}

/** Get or create a CryptoKey for encrypting queue payloads (persisted in sessionStorage as raw key hex). */
export async function getQueueEncryptionKey(): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null
  let rawHex = getKeyStorage()
  if (!rawHex || rawHex.length !== (KEY_LENGTH / 8) * 2) {
    const key = await window.crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ["encrypt", "decrypt"]
    )
    const exported = await window.crypto.subtle.exportKey("raw", key)
    rawHex = Array.from(new Uint8Array(exported))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    setKeyStorage(rawHex)
    return key
  }
  const raw = new Uint8Array(rawHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
  return window.crypto.subtle.importKey(
    "raw",
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

/** Encrypt plaintext (e.g. JSON string); returns base64(iv + ciphertext), or null if encryption unavailable. */
export async function encryptQueuePayload(plaintext: string): Promise<string | null> {
  const key = await getQueueEncryptionKey()
  if (!key) return null
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)
  const cipher = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: 128 },
    key,
    encoded
  )
  const combined = new Uint8Array(iv.length + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.length)
  return btoa(String.fromCharCode(...combined))
}

/** Decrypt base64(iv + ciphertext) back to plaintext. Returns null if decryption fails (e.g. wrong key). */
export async function decryptQueuePayload(b64: string): Promise<string | null> {
  const key = await getQueueEncryptionKey()
  if (!key) return null
  try {
    const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, IV_LENGTH)
    const cipher = combined.slice(IV_LENGTH)
    const dec = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: 128 },
      key,
      cipher
    )
    return new TextDecoder().decode(dec)
  } catch {
    return null
  }
}

/** True if encryption is available in this environment. */
export function isEncryptionAvailable(): boolean {
  return typeof window !== "undefined" && !!window.crypto?.subtle && !!window.sessionStorage
}
