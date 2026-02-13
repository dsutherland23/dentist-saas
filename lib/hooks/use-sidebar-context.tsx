"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface SidebarContextType {
    isCollapsed: boolean
    toggle: () => void
    setCollapsed: (collapsed: boolean) => void
    isHovering: boolean
    setIsHovering: (hovering: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    // Auto-collapse on Clinical Referrals page
    useEffect(() => {
        if (pathname?.includes("/clinical-referrals")) {
            setIsCollapsed(true)
        }
    }, [pathname])

    const toggle = () => {
        console.log("Sidebar toggle triggered. Current isCollapsed:", isCollapsed)
        setIsCollapsed(prev => !prev)
        setIsHovering(false) // Force immediate visual feedback
    }

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                toggle,
                setCollapsed: setIsCollapsed,
                isHovering: isCollapsed ? isHovering : false, // Only allow hovering state if collapsed
                setIsHovering
            }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
