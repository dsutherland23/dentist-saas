"use client"

import { useEffect } from "react"

/**
 * Next.js 16 dev overlay enumerates page props (including params Promise) when
 * showing component info on mouse move, which triggers the "params are being
 * enumerated" warning even when the page correctly uses React.use(params).
 * This component filters that specific console.error in development only.
 */
export function DevSuppressParamsWarning() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return
        const original = console.error
        console.error = (...args: unknown[]) => {
            const msg = typeof args[0] === "string" ? args[0] : ""
            if (msg.includes("params are being enumerated") && msg.includes("React.use()")) {
                return
            }
            original.apply(console, args)
        }
        return () => {
            console.error = original
        }
    }, [])
    return null
}
