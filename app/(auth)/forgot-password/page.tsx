"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const supabase = createClient()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            })
            if (error) throw error
            setSent(true)
            toast.success("Check your email for the reset link")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send reset email")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthShell topRightLink={{ href: "/login", label: "Log in" }}>
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [font-family:var(--font-heading),ui-sans-serif,sans-serif]">
                        Reset password
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {sent
                            ? "We sent a link to your email. Check your inbox and spam folder."
                            : "Enter your email and we’ll send you a reset link."}
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                    {sent ? (
                        <div className="space-y-4">
                            <Button asChild className="w-full h-12 rounded-xl font-medium">
                                <Link href="/login">
                                    Back to sign in
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 rounded-xl"
                                onClick={() => setSent(false)}
                            >
                                Send another link
                            </Button>
                        </div>
                    ) : (
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
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Sending…
                                    </span>
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </form>
                    )}

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
