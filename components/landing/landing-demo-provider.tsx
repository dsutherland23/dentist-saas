"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { DemoRequestDialog } from "@/components/landing/demo-request-dialog"

type LandingDemoContextValue = {
    openDemo: (source?: string) => void
}

const LandingDemoContext = createContext<LandingDemoContextValue | null>(null)

export function useLandingDemo() {
    const ctx = useContext(LandingDemoContext)
    if (!ctx) return { openDemo: () => {} }
    return ctx
}

export function LandingDemoProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [source, setSource] = useState("landing")

    const openDemo = useCallback((s?: string) => {
        setSource(s || "landing")
        setOpen(true)
    }, [])

    return (
        <LandingDemoContext.Provider value={{ openDemo }}>
            {children}
            <DemoRequestDialog
                open={open}
                onOpenChange={setOpen}
                source={source}
            />
        </LandingDemoContext.Provider>
    )
}
