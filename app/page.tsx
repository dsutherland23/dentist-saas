import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { LandingDemoProvider } from "@/components/landing/landing-demo-provider"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingScrollBanner } from "@/components/landing/landing-scroll-banner"
import { LandingFeatureShowcase } from "@/components/landing/landing-feature-showcase"
import { LandingWorkflow } from "@/components/landing/landing-workflow"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingTestimonials } from "@/components/landing/landing-testimonials"
import { LandingPricing } from "@/components/landing/landing-pricing"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
    title: "DentalCare Pro – Practice management for modern dental offices",
    description:
        "Scheduling, patients, billing, and insurance in one place. Run your practice without the paperwork.",
}

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect("/dashboard")
    }

    return (
        <LandingDemoProvider>
            <div className="min-h-screen flex flex-col" data-landing-dark>
                <LandingHeader />
                <main className="flex-1">
                    <LandingHero />
                    <LandingScrollBanner />
                    <LandingFeatureShowcase />
                    <LandingWorkflow />
                    <LandingFeatures />
                    <LandingTestimonials />
                    <LandingPricing />
                    <LandingCTA />
                </main>
                <LandingFooter />
            </div>
        </LandingDemoProvider>
    )
}
