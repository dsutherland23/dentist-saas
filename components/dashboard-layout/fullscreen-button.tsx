"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"

export function FullscreenButton() {
    const [useFullscreen, setUseFullscreen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        fetch("/api/settings/clinic")
            .then((res) => res.ok ? res.json() : null)
            .then((data) => setUseFullscreen(!!data?.use_fullscreen))
            .catch(() => {})
    }, [])

    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handler)
        return () => document.removeEventListener("fullscreenchange", handler)
    }, [])

    const toggle = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
            } else {
                await document.documentElement.requestFullscreen()
            }
        } catch (err) {
            console.warn("Fullscreen not supported or denied:", err)
        }
    }

    if (!useFullscreen) return null

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={toggle}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen (hide URL bar)"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
    )
}
