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
            // Store clinic info in session/local state for now
            const clinicData = {
                clinicName: values.clinicName,
                adminName: values.adminName,
                email: values.email,
                createdAt: new Date().toISOString()
            }
            
            // Store in sessionStorage for now (will be replaced with proper backend)
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('clinic_pending', JSON.stringify(clinicData))
            }

            toast.success("Clinic created! Redirecting to dashboard...")
            
            // Simulate auth delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            router.push("/dashboard")

        } catch (error) {
            console.error("Signup error:", error)
            toast.error(error instanceof Error ? error.message : "Registration failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Right Side - Visuals (visible on desktop) */}
            <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-900 p-12 text-white">
                <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-20" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Stethoscope className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">DentalCare Pro</span>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-bold leading-tight">
                                Transform your <span className="text-teal-400">practice</span> with modern tech.
                            </h2>
                            <p className="text-xl text-slate-400 max-w-lg">
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
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="h-6 w-6 rounded-full bg-teal-500/10 border border-teal-500/50 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg text-slate-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 glass-dark rounded-3xl border border-white/10">
                        <div className="flex items-center gap-4">
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
            <div className="flex items-center justify-center p-6 sm:p-12 bg-white relative overflow-hidden">
                {/* Background gradient accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-40" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-30" />

                <div className="w-full max-w-lg space-y-10 relative z-10">
                    {/* Logo - Mobile Only */}
                    <div className="lg:hidden flex justify-center">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">DentalCare Pro</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="space-y-3 lg:space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                            Get Started
                        </h1>
                        <p className="text-lg text-slate-600 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-teal-500 flex-shrink-0" />
                            Create your professional clinic workspace
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="px-8 py-10">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Clinic Name */}
                                    <FormField
                                        control={form.control}
                                        name="clinicName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Clinic Name
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="Acme Dental Practice" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Admin Name */}
                                    <FormField
                                        control={form.control}
                                        name="adminName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Admin Full Name
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="Dr. John Doe" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Email */}
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Professional Email
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="name@clinic.com" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Password */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            type="password" 
                                                            placeholder="••••••••" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 transition-all duration-200 group mt-8"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-3">
                                                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                <span>Creating Account...</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Create Practice Account
                                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 text-center space-y-2">
                            <p className="text-sm text-slate-600">
                                Already have an account?{" "}
                                <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Legal Text */}
                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Right Side - Visuals (visible on desktop) */}
            <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-900 p-12 text-white">
                <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-20" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Stethoscope className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">DentalCare Pro</span>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-bold leading-tight">
                                Transform your <span className="text-teal-400">practice</span> with modern tech.
                            </h2>
                            <p className="text-xl text-slate-400 max-w-lg">
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
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="h-6 w-6 rounded-full bg-teal-500/10 border border-teal-500/50 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg text-slate-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 glass-dark rounded-3xl border border-white/10">
                        <div className="flex items-center gap-4">
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
            <div className="flex items-center justify-center p-6 sm:p-12 bg-white relative overflow-hidden">
                {/* Background gradient accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-40" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-30" />

                <div className="w-full max-w-lg space-y-10 relative z-10">
                    {/* Logo - Mobile Only */}
                    <div className="lg:hidden flex justify-center">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">DentalCare Pro</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="space-y-3 lg:space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                            Get Started
                        </h1>
                        <p className="text-lg text-slate-600 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-teal-500 flex-shrink-0" />
                            Create your professional clinic workspace
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="px-8 py-10">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Clinic Name */}
                                    <FormField
                                        control={form.control}
                                        name="clinicName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Clinic Name
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="Acme Dental Practice" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Admin Name */}
                                    <FormField
                                        control={form.control}
                                        name="adminName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Admin Full Name
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="Dr. John Doe" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Email */}
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Professional Email
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            placeholder="name@clinic.com" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Password */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-semibold text-slate-900">
                                                    Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
                                                        <Input 
                                                            type="password" 
                                                            placeholder="••••••••" 
                                                            className="pl-12 h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-base rounded-lg transition-all duration-200" 
                                                            {...field} 
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 transition-all duration-200 group mt-8"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-3">
                                                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                <span>Creating Account...</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Create Practice Account
                                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 text-center space-y-2">
                            <p className="text-sm text-slate-600">
                                Already have an account?{" "}
                                <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Legal Text */}
                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
