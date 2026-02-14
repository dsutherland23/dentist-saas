"use client"

import { createContext, useContext, useState } from "react"

type AuthContextType = {
    isAuthenticated: boolean
    clinicName: string | null
    adminName: string | null
    email: string | null
    isLoading: boolean
    signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [clinicName, setClinicName] = useState<string | null>(null)
    const [adminName, setAdminName] = useState<string | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [isLoading] = useState(false)

    // Try to load from sessionStorage on mount
    if (typeof window !== 'undefined' && !clinicName) {
        const pendingClinic = sessionStorage.getItem('clinic_pending')
        if (pendingClinic) {
            try {
                const data = JSON.parse(pendingClinic)
                setClinicName(data.clinicName)
                setAdminName(data.adminName)
                setEmail(data.email)
            } catch (e) {
                console.error('Failed to parse clinic data:', e)
            }
        }
    }

    const signOut = () => {
        setClinicName(null)
        setAdminName(null)
        setEmail(null)
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('clinic_pending')
        }
    }

    return (
        <AuthContext.Provider 
            value={{ 
                isAuthenticated: !!clinicName, 
                clinicName, 
                adminName, 
                email, 
                isLoading, 
                signOut 
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
