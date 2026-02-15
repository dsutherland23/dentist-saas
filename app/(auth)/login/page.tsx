"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Sparkles, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react"

import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

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

            toast.success("Welcome back!")
            router.push("/dashboard")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid login credentials")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4 sm:p-6 py-6 sm:py-8 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />

            <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10 animate-fade-in">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 border border-teal-100">
                            <Stethoscope className="h-8 w-8 sm:h-9 sm:w-9 text-teal-600" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">Welcome back</h1>
                        <p className="text-sm sm:text-base text-slate-500 flex items-center justify-center gap-2 flex-wrap">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Secure access to your practice dashboard
                        </p>
                    </div>
                </div>

                <Card className="glass border-0 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400" />
                    <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold">Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 px-4 sm:px-6">
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium ml-1">Email Address</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="dr.smith@clinic.com"
                                            required
                                            className="pl-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password">Password</Label>
                                        <Link href="/forgot-password" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="pl-10 bg-white/50 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                        />
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
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Sign in to Dashboard
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white/80 backdrop-blur-sm px-4 text-slate-400 font-medium">
                                    Trusted by 1,000+ clinics
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading}
                                className="min-h-[44px] h-11 border-slate-200 bg-white/50 hover:bg-slate-50 transition-all font-semibold"
                            >
                                <Sparkles className="h-4 w-4 mr-2 text-teal-600" />
                                SSO Enterprise Login
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 sm:pb-8 px-4 sm:px-6 text-center bg-slate-50/50 backdrop-blur-sm border-t border-slate-100">
                        <div className="text-sm text-slate-600">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
                                Create practice account
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                <div className="text-center space-y-4 animate-fade-in px-2" style={{ animationDelay: '0.4s' }}>
                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                        High-security dental management compliant with healthcare data regulations.
                    </p>
                </div>
            </div>
        </div>
    )
}
