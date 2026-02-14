"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Building2, User, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [clinicName, setClinicName] = useState("")
    const [adminName, setAdminName] = useState("")

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!clinicName.trim()) {
            toast.error("Please enter your clinic name")
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/complete-setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clinicName: clinicName.trim(),
                    adminName: adminName.trim() || undefined,
                }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.error || "Setup failed")
            }

            toast.success("Clinic setup complete! Redirecting...")
            router.push("/dashboard")
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4 sm:p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 border border-teal-100">
                        <Stethoscope className="h-9 w-9 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                            Complete your setup
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base">
                            Create your clinic to get started with DentalCare Pro
                        </p>
                    </div>
                </div>

                <Card className="glass border-0 shadow-2xl shadow-slate-200/50">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400 rounded-t-lg" />
                    <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
                        <CardTitle className="text-xl font-bold">Clinic details</CardTitle>
                        <CardDescription>
                            Enter your practice information to continue
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={onSubmit}>
                        <CardContent className="space-y-4 px-4 sm:px-6">
                            <div className="space-y-2">
                                <Label htmlFor="clinicName">Clinic name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="clinicName"
                                        placeholder="Acme Dental Practice"
                                        className="pl-10"
                                        value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)}
                                        required
                                        minLength={2}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminName">Your name (optional)</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="adminName"
                                        placeholder="Dr. Smith"
                                        className="pl-10"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pt-4 pb-6 px-4 sm:px-6">
                            <Button
                                type="submit"
                                className="w-full h-12 gradient-primary text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-xl transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Setting up...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Create clinic
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500 text-center">
                                Need help?{" "}
                                <Link href="/login" className="text-teal-600 hover:underline font-medium">
                                    Contact support
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
