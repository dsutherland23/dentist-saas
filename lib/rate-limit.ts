/**
 * In-memory rate limiter for specialist intake submissions.
 * Production at scale: replace with Redis/Upstash.
 */
const windowMs = 60 * 60 * 1000 // 1 hour
const maxPerIp = 10

const hits = new Map<string, { count: number; resetAt: number }>()

function prune() {
    const now = Date.now()
    for (const [key, v] of hits.entries()) {
        if (v.resetAt <= now) hits.delete(key)
    }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    prune()
    const now = Date.now()
    const entry = hits.get(ip)
    if (!entry) {
        hits.set(ip, { count: 1, resetAt: now + windowMs })
        return { allowed: true }
    }
    if (entry.resetAt <= now) {
        entry.count = 1
        entry.resetAt = now + windowMs
        return { allowed: true }
    }
    if (entry.count >= maxPerIp) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
    }
    entry.count += 1
    return { allowed: true }
}
