"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type Profile = {
    id: string
    clinic_id: string
    first_name: string
    last_name: string
    email: string
    role: string
    allowed_sections?: string[] | null
    limits?: Record<string, number> | null
    must_change_password?: boolean
    clinic?: {
        name: string
    }
}

type AuthContextType = {
    user: User | null
    profile: Profile | null
    session: Session | null
    isLoading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*, clinic:clinics(name)')
            .eq('id', userId)
            .single()

        if (!error && data) {
            const p = data as Profile
            setProfile(p)
            if (p.must_change_password && typeof window !== 'undefined' && !window.location.pathname.startsWith('/set-password')) {
                router.replace('/set-password')
            }
        }
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }

                setIsLoading(false)

                if (event === 'SIGNED_OUT') {
                    router.push('/login')
                }
            }
        )

        // Initial fetch
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            }
            setIsLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [router, supabase])

    const signOut = async () => {
        setProfile(null)
        setUser(null)
        setSession(null)
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.error("[AUTH] signOut error:", e)
        }
        // Hard redirect so cookies and cache are cleared on the next request
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider value={{ user, profile, session, isLoading, signOut }}>
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
