"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { Lock, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [hasSession, setHasSession] = useState<boolean | null>(null)
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasSession(!!session)
        })
    }, [])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        const password = formData.get("password") as string

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            toast.success("Password updated successfully")
            router.push("/login")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update password")
        } finally {
            setIsLoading(false)
        }
    }

    if (hasSession === null) {
        return (
            <AuthShell showBrand={true}>
                <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </AuthShell>
        )
    }

    if (!hasSession) {
        return (
            <AuthShell topRightLink={{ href: "/login", label: "Log in" }}>
                <div className="w-full max-w-[400px] rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8 text-center space-y-4">
                    <h1 className="text-xl font-semibold text-foreground">Invalid or expired link</h1>
                    <p className="text-sm text-muted-foreground">
                        The password reset link may have expired. Request a new one from the forgot password page.
                    </p>
                    <Button asChild className="rounded-xl">
                        <Link href="/forgot-password">Request new link</Link>
                    </Button>
                </div>
            </AuthShell>
        )
    }

    return (
        <AuthShell topRightLink={{ href: "/login", label: "Log in" }}>
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [font-family:var(--font-heading),ui-sans-serif,sans-serif]">
                        Set new password
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Choose a secure password (at least 8 characters).
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    minLength={8}
                                    placeholder="••••••••"
                                    required
                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Updating…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Update password
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        <Link href="/login" className="font-medium text-foreground hover:underline">
                            ← Back to sign in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthShell>
    )
}
