"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smile } from "lucide-react"
import { useLandingDemo } from "@/components/landing/landing-demo-provider"

export function LandingFooter() {
    const { openDemo } = useLandingDemo()
    return (
        <footer className="border-t border-white/10 bg-[hsl(var(--background))] px-4 py-12 sm:px-6">
            <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
                <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                    <Smile className="h-5 w-5 text-primary" aria-hidden />
                    <span>DentalCare Pro</span>
                </Link>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a href="#features" className="text-sm text-[hsl(213,31%,88%)] hover:text-white transition-colors">
                        Features
                    </a>
                    <a href="#testimonials" className="text-sm text-[hsl(213,31%,88%)] hover:text-white transition-colors">
                        Testimonials
                    </a>
                    <a href="#pricing" className="text-sm text-[hsl(213,31%,88%)] hover:text-white transition-colors">
                        Pricing
                    </a>
                    <Button variant="ghost" size="sm" className="landing-btn-ghost text-white hover:bg-white/10" onClick={() => openDemo("footer")}>
                        Schedule a Demo
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="landing-btn-ghost text-white hover:bg-white/10">
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="landing-btn-outline border-white/40 text-white hover:bg-white/10 hover:text-white">
                        <Link href="/signup">Get started</Link>
                    </Button>
                </div>
            </div>
            <p className="mt-6 text-center text-sm text-[hsl(213,31%,78%)]">
                © {new Date().getFullYear()} DentalCare Pro. All rights reserved.
            </p>
        </footer>
    )
}
