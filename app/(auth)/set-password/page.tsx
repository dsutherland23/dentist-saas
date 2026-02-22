"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

export default function SetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const supabase = createClient()

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)

        const form = event.currentTarget as HTMLFormElement
        const formData = new FormData(form)
        const newPassword = formData.get("new_password") as string
        const confirmPassword = formData.get("confirm_password") as string
        const firstName = formData.get("first_name") as string
        const lastName = formData.get("last_name") as string

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            setIsLoading(false)
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            setIsLoading(false)
            return
        }

        try {
            // Update password in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
            if (authError) throw authError

            // Clear the must_change_password flag and update name via API
            const res = await fetch("/api/auth/complete-first-login", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName || undefined,
                    last_name: lastName || undefined,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to complete setup")
            }

            toast.success("Password updated successfully! Welcome aboard.")
            router.replace("/dashboard")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
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
                            Welcome to the team
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500 flex items-center justify-center gap-2 flex-wrap">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Set up your account to get started
                        </p>
                    </div>
                </div>

                <Card className="glass border-0 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400" />
                    <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold">Update your password</CardTitle>
                        <CardDescription>
                            You must set a new password before you can continue. Optionally update your display name.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-medium ml-1">First Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            placeholder="First"
                                            className="pl-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-medium ml-1">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        placeholder="Last"
                                        className="bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new_password" className="text-sm font-medium ml-1">New Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        id="new_password"
                                        name="new_password"
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        minLength={8}
                                        placeholder="At least 8 characters"
                                        className="pl-10 pr-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm_password" className="text-sm font-medium ml-1">Confirm Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        minLength={8}
                                        placeholder="Confirm your password"
                                        className="pl-10 pr-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                className="w-full min-h-[44px] h-12 gradient-primary text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/40 transition-all group"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Set password & continue
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center space-y-4 animate-fade-in px-2" style={{ animationDelay: "0.4s" }}>
                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                        Your password is encrypted and securely stored.
                    </p>
                </div>
            </div>
        </div>
    )
}
