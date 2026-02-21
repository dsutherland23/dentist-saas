"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingReveal } from "@/components/landing/landing-reveal"
import { useLandingDemo } from "@/components/landing/landing-demo-provider"

export function LandingCTA() {
    const { openDemo } = useLandingDemo()
    return (
        <section className="relative border-b border-white/5 overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
            {/* Diagonal gradient + grid + radial glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,45%,8%)] to-[hsl(222,47%,6%)]" aria-hidden />
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0V0zm2 0h1v40H2V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
                aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,hsl(var(--primary)/0.12),transparent_70%)]" aria-hidden />
            <LandingReveal className="container relative mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Ready to simplify your practice?
                </h2>
                <p className="mt-4 text-lg text-[hsl(213,31%,92%)]">
                    Join practices that use DentalCare Pro for scheduling, patients, billing, and team—without the paperwork.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <Button
                        size="lg"
                        className="gap-2 bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.4)] hover:bg-primary/90"
                        onClick={() => openDemo("cta")}
                    >
                        Schedule a Demo
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="outline" size="lg" asChild className="landing-btn-outline border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                        <Link href="/signup">Get started free</Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="landing-btn-ghost text-white hover:bg-white/10 hover:text-white">
                        <Link href="/login">Log in</Link>
                    </Button>
                </div>
            </LandingReveal>
        </section>
    )
}
