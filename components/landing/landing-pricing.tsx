"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LandingReveal, LandingRevealStagger, LandingRevealStaggerItem } from "@/components/landing/landing-reveal"
import { useLandingDemo } from "@/components/landing/landing-demo-provider"

const plans = [
    {
        name: "Starter",
        description: "For small practices getting started",
        price: "Custom",
        period: "per month",
        features: [
            "Scheduling & calendar",
            "Patient records",
            "Basic billing",
            "Email support",
        ],
        cta: "Contact sales",
        highlighted: false,
    },
    {
        name: "Professional",
        description: "For growing practices that need more",
        price: "Custom",
        period: "per month",
        features: [
            "Everything in Starter",
            "Insurance claims",
            "Clinical referrals",
            "Reports & analytics",
            "Team planner",
            "Priority support",
        ],
        cta: "Get started",
        highlighted: true,
    },
    {
        name: "Enterprise",
        description: "For large groups and DSOs",
        price: "Custom",
        period: "per month",
        features: [
            "Everything in Professional",
            "Multi-location",
            "Custom integrations",
            "Dedicated success manager",
            "SLA & compliance",
        ],
        cta: "Contact sales",
        highlighted: false,
    },
]

export function LandingPricing() {
    const { openDemo } = useLandingDemo()
    return (
        <section id="pricing" className="border-b border-white/5 px-4 py-16 sm:px-6 sm:py-24">
            <div className="container mx-auto max-w-6xl">
                <LandingReveal className="mb-12 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-2 text-[hsl(213,31%,85%)]">
                        Plans that scale with your practice. No hidden fees.
                    </p>
                </LandingReveal>
                <LandingRevealStagger className="grid gap-6 lg:grid-cols-3" staggerChildren={0.1}>
                    {plans.map((plan) => (
                        <LandingRevealStaggerItem key={plan.name}>
                            <Card
                                className={cn(
                                    "flex flex-col border-0 bg-[hsl(var(--card))]/80 shadow-none ring-1 ring-white/10 backdrop-blur-sm transition-shadow hover:shadow-md hover:-translate-y-0.5",
                                    plan.highlighted &&
                                        "ring-2 ring-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                                )}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">
                                        {plan.name}
                                    </CardTitle>
                                    <CardDescription className="text-[hsl(213,31%,85%)]">
                                        {plan.description}
                                    </CardDescription>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">
                                            {plan.price}
                                        </span>
                                        <span className="text-[hsl(213,31%,82%)]">
                                            {plan.period}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-center gap-2 text-sm text-[hsl(213,31%,85%)]"
                                            >
                                                <Check
                                                    className="h-4 w-4 shrink-0 text-primary"
                                                    aria-hidden
                                                />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {plan.cta === "Get started" ? (
                                        <Button asChild className={"w-full " + (plan.highlighted ? "" : "landing-btn-outline border-white/40 bg-transparent text-white hover:bg-white/10")} variant={plan.highlighted ? "default" : "outline"} size="lg">
                                            <Link href="/signup">{plan.cta}</Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full landing-btn-outline border-white/40 bg-transparent text-white hover:bg-white/10"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => openDemo("pricing")}
                                        >
                                            Schedule a Demo
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </LandingRevealStaggerItem>
                    ))}
                </LandingRevealStagger>
            </div>
        </section>
    )
}
