import {
    Calendar,
    Users,
    CreditCard,
    MessageSquare,
    BarChart3,
    ShieldCheck,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LandingReveal, LandingRevealStagger, LandingRevealStaggerItem } from "@/components/landing/landing-reveal"

const features = [
    {
        title: "Scheduling & calendar",
        description: "One calendar for your whole practice. Appointments, blocked slots, and team visibility in a single view.",
        icon: Calendar,
        gradient: "from-violet-500 to-purple-600",
    },
    {
        title: "Patients & records",
        description: "Patient records, contact info, and ID scan to capture name and DOB from a photo—all in one place.",
        icon: Users,
        gradient: "from-pink-500 to-rose-600",
    },
    {
        title: "Billing & insurance",
        description: "Invoices, insurance claims, and payments without the paperwork. Track what’s submitted and what’s paid.",
        icon: CreditCard,
        gradient: "from-emerald-500 to-teal-600",
    },
    {
        title: "Clinical referrals",
        description: "Send and receive referrals with specialists. Build intake messages and keep referral history in one workflow.",
        icon: ShieldCheck,
        gradient: "from-blue-500 to-indigo-600",
    },
    {
        title: "Messages & follow-up",
        description: "Stay in touch with patients and see follow-ups and reminders from your dashboard.",
        icon: MessageSquare,
        gradient: "from-cyan-500 to-blue-600",
    },
    {
        title: "Reports & team",
        description: "Reports and analytics for your practice. Staff management and team planner so everyone stays in sync.",
        icon: BarChart3,
        gradient: "from-orange-500 to-amber-600",
    },
]

export function LandingFeatures() {
    return (
        <section id="features" className="border-b border-white/5 px-4 py-16 sm:px-6 sm:py-24">
            <div className="container mx-auto max-w-6xl">
                <LandingReveal className="mb-12 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Everything your practice needs
                    </h2>
                    <p className="mt-2 text-[hsl(213,31%,85%)]">
                        One platform for scheduling, patients, billing, and team—designed for modern dental offices.
                    </p>
                </LandingReveal>
                <LandingRevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerChildren={0.08}>
                    {features.map(({ title, description, icon: Icon, gradient }) => (
                        <LandingRevealStaggerItem key={title}>
                            <Card className="overflow-hidden rounded-2xl border-0 bg-[hsl(var(--card))]/60 shadow-none ring-1 ring-white/8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 hover:ring-white/20">
                                <CardHeader>
                                    <div
                                        className={cn(
                                            "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-[0_0_20px_hsl(var(--primary)/0.2)]",
                                            gradient
                                        )}
                                        aria-hidden
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg text-white">{title}</CardTitle>
                                    <CardDescription className="text-[hsl(213,31%,85%)]">{description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </LandingRevealStaggerItem>
                    ))}
                </LandingRevealStagger>
            </div>
        </section>
    )
}
