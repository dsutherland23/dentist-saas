"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AuthShell } from "@/components/auth/auth-shell"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

function getDomainFromInput(value: string): string | null {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return null
    if (trimmed.includes("@")) {
        const part = trimmed.split("@")[1]
        return part && part.includes(".") ? part : null
    }
    return trimmed.includes(".") ? trimmed : null
}

function LoginPageContent() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [ssoDialogOpen, setSsoDialogOpen] = useState(false)
    const [ssoEmailOrDomain, setSsoEmailOrDomain] = useState("")
    const [ssoLoading, setSsoLoading] = useState(false)
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const err = searchParams.get("error")
        if (err) {
            toast.error(decodeURIComponent(err))
            window.history.replaceState({}, "", "/login")
        }
    }, [searchParams])

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget as HTMLFormElement)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            fetch("/api/auth/log-login", { method: "POST" }).catch(() => {})
            toast.success("Welcome back!")
            router.push("/dashboard")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid login credentials")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSsoSubmit(e: React.FormEvent) {
        e.preventDefault()
        const domain = getDomainFromInput(ssoEmailOrDomain)
        if (!domain) {
            toast.error("Enter your work email (e.g. you@company.com) or organization domain (e.g. company.com)")
            return
        }
        setSsoLoading(true)
        try {
            const origin = typeof window !== "undefined" ? window.location.origin : ""
            const { data, error } = await supabase.auth.signInWithSSO({
                domain,
                options: {
                    redirectTo: `${origin}/auth/callback?next=/dashboard`,
                },
            })
            if (error) {
                if (error.message?.toLowerCase().includes("provider") || error.message?.toLowerCase().includes("domain")) {
                    toast.error("No SSO provider found for this domain. Use email and password or ask your admin to enable SSO.")
                } else {
                    toast.error(error.message || "SSO sign-in failed")
                }
                return
            }
            if (data?.url) {
                toast.success("Redirecting to your organization's sign-in…")
                window.location.href = data.url
            } else {
                toast.error("SSO sign-in could not be started. Try email and password.")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "SSO sign-in failed")
        } finally {
            setSsoLoading(false)
        }
    }

    return (
        <AuthShell topRightLink={{ href: "/signup", label: "Sign up" }}>
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [font-family:var(--font-heading),ui-sans-serif,sans-serif]">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to your practice dashboard.
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@clinic.com"
                                    required
                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
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
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-3 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-xl border-border"
                        disabled={isLoading}
                        onClick={() => setSsoDialogOpen(true)}
                    >
                        Sign in with SSO
                    </Button>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        No account?{" "}
                        <Link href="/signup" className="font-medium text-foreground hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>

            <Dialog open={ssoDialogOpen} onOpenChange={setSsoDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Sign in with SSO</DialogTitle>
                        <DialogDescription>
                            Enter your work email or your organization&apos;s domain. You&apos;ll be redirected to your identity provider.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSsoSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sso-email">Work email or domain</Label>
                            <Input
                                id="sso-email"
                                type="text"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="you@company.com or company.com"
                                value={ssoEmailOrDomain}
                                onChange={(e) => setSsoEmailOrDomain(e.target.value)}
                                disabled={ssoLoading}
                                className="rounded-xl"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSsoDialogOpen(false)}
                                disabled={ssoLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={ssoLoading || !ssoEmailOrDomain.trim()}>
                                {ssoLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Redirecting…
                                    </>
                                ) : (
                                    "Continue with SSO"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthShell>
    )
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <AuthShell showBrand={true}>
                    <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </AuthShell>
            }
        >
            <LoginPageContent />
        </Suspense>
    )
}
