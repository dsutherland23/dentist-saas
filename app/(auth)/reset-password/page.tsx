"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, ArrowRight, ShieldCheck, Lock } from "lucide-react"
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
            <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh">
                <span className="h-8 w-8 border-2 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
            </div>
        )
    }

    if (!hasSession) {
        return (
            <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Invalid or expired link</CardTitle>
                        <CardDescription>
                            The password reset link may have expired. Request a new one from the forgot password page.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/forgot-password">Request new link</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4 sm:p-6 py-6 sm:py-8 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-float" style={{ animationDelay: "-2s" }} />

            <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10 animate-fade-in">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 border border-teal-100">
                            <Stethoscope className="h-8 w-8 sm:h-9 sm:w-9 text-teal-600" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
                            Set new password
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500 flex items-center justify-center gap-2 flex-wrap">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Choose a secure password (min 8 characters)
                        </p>
                    </div>
                </div>

                <Card className="glass border-0 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400" />
                    <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold">New password</CardTitle>
                        <CardDescription>Enter your new password below.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium ml-1">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        minLength={8}
                                        placeholder="••••••••"
                                        required
                                        className="pl-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full min-h-11 gradient-primary text-white font-bold"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </span>
                                ) : (
                                    <>
                                        Update password <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 sm:pb-8 px-4 sm:px-6 text-center bg-slate-50/50 backdrop-blur-sm border-t border-slate-100">
                        <Link
                            href="/login"
                            className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors"
                        >
                            ← Back to sign in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
