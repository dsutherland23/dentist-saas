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
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"
import { AuthShell } from "@/components/auth/auth-shell"
import { ArrowRight, Building2, User, Mail, Lock } from "lucide-react"

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
        setIsLoading(true)
        try {
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
                        "Too many sign-up attempts. Please wait an hour and try again, or use a different email."
                    )
                }
                throw new Error(authError.message)
            }

            if (authData.user) {
                const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: authData.user.id,
                        email: values.email,
                        clinicName: values.clinicName,
                        adminName: values.adminName,
                    }),
                })
                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to initialize clinic details")
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
        <AuthShell topRightLink={{ href: "/login", label: "Log in" }}>
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [font-family:var(--font-heading),ui-sans-serif,sans-serif]">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Set up your practice in a few steps.
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="clinicName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Clinic name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    placeholder="e.g. Acme Dental"
                                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                                    {...field}
                                                />
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
                                        <FormLabel>Your name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    placeholder="e.g. Dr. Jane Smith"
                                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                                    {...field}
                                                />
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
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    type="email"
                                                    placeholder="you@clinic.com"
                                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                                    {...field}
                                                />
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    type="password"
                                                    placeholder="At least 8 characters"
                                                    className="pl-9 h-11 rounded-xl border-border bg-background"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl mt-2 font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Creating account…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Create account
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-foreground hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground max-w-[320px]">
                    By signing up you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">Privacy</Link>.
                </p>
            </div>
        </AuthShell>
    )
}
