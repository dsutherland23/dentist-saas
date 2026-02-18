"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"
import { Stethoscope, Sparkles, ArrowRight, Building2, User, Mail, Lock, CheckCircle2 } from "lucide-react"

const formSchema = z.object({
    clinicName: z.string().min(2, {
        message: "Clinic name must be at least 2 characters.",
    }),
    adminName: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
})

export default function SignUpPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clinicName: "",
            adminName: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Submitting signup form:", values)
        setIsLoading(true)

        try {
            // 1. Sign up the user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.adminName,
                        clinic_name: values.clinicName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (authError) {
                const msg = authError.message || ""
                if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("email rate limit")) {
                    throw new Error(
                        "Too many sign-up attempts. Please wait an hour and try again, or use a different email. " +
                        "If you're the site admin, you can turn off \"Confirm email\" in Supabase (Authentication → Providers → Email) for development."
                    )
                }
                throw new Error(authError.message)
            }

            if (authData.user) {
                // 2. Call API to create clinic and user record
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: authData.user.id,
                        email: values.email,
                        clinicName: values.clinicName,
                        adminName: values.adminName
                    })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to initialize clinic details')
                }
            }

            if (!authData.session) {
                toast.success("Verification email sent! Please check your inbox.")
                router.push("/login")
            } else {
                toast.success("Account created successfully!")
                router.push("/dashboard")
            }

        } catch (error) {
            console.error("Signup error:", error)
            toast.error(error instanceof Error ? error.message : "Registration failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen min-h-dvh grid lg:grid-cols-2">
            {/* Right Side - Visuals (visible on desktop) */}
            <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-900 p-8 xl:p-12 text-white">
                <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-20" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Stethoscope className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">DentalCare Pro</span>
                    </div>

                    <div className="space-y-6 xl:space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight">
                                Transform your <span className="text-teal-400">practice</span> with modern tech.
                            </h2>
                            <p className="text-lg xl:text-xl text-slate-400 max-w-lg">
                                Join 1,000+ clinics worldwide using our platform to manage appointments, patients, and billing with ease.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                "Integrated Dental Records & Imaging",
                                "Automated Appointment Scheduling",
                                "Professional Invoicing & Payments",
                                "Real-time Practice Analytics"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 xl:gap-4 group">
                                    <div className="h-5 w-5 xl:h-6 xl:w-6 shrink-0 rounded-full bg-teal-500/10 border border-teal-500/50 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                                        <CheckCircle2 className="h-3 w-3 xl:h-4 xl:w-4 text-teal-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-base xl:text-lg text-slate-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 xl:p-8 glass-dark rounded-2xl xl:rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 xl:gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500" />
                            <div>
                                <p className="font-bold text-lg">Dr. Sarah Jenkins</p>
                                <p className="text-teal-400 text-sm italic">"The transition was seamless. Best ROI for our clinic this year."</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-teal-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[80px]" />
            </div>

            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] bg-slate-50 relative overflow-hidden overflow-y-auto min-h-screen min-h-dvh">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 font-medical">DentalCare</span>
                        </div>
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Get Started</h1>
                        <p className="text-slate-500 flex items-center gap-2 justify-center lg:justify-start">
                            <Sparkles className="h-4 w-4 text-teal-600 animate-pulse" />
                            Create your professional clinic workspace
                        </p>
                    </div>

                    <Card className="border-0 shadow-2xl shadow-slate-200/60 bg-white/70 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl">Practice Details</CardTitle>
                            <CardDescription>All fields are required for setup</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="clinicName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-900">Clinic Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                                            <Input placeholder="Acme Dental Practice" className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="adminName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-900">Admin Full Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                                            <Input placeholder="Dr. John Doe" className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-900">Professional Email</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                                            <Input placeholder="name@clinic.com" className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-900">Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                                            <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full min-h-[44px] h-12 gradient-primary text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/40 transition-all group mt-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Initializing Practice...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Create Practice Account
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 text-center bg-slate-50/50 backdrop-blur-sm border-t border-slate-100 rounded-b-3xl">
                            <div className="text-sm text-slate-600">
                                Already using DentalCare?{" "}
                                <Link href="/login" className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
                                    Sign in here
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>

                    <p className="px-4 sm:px-8 text-center text-xs text-slate-400 leading-relaxed">
                        By completing this setup, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-slate-600">Terms</Link> and{" "}
                        <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
                        SSL Encryption is active.
                    </p>
                </div>
            </div>
        </div>
    )
}
