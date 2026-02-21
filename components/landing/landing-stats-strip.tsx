import { LandingReveal } from "@/components/landing/landing-reveal"

export function LandingStatsStrip() {
    return (
        <section className="border-b bg-muted/30 py-8 sm:py-10">
            <LandingReveal className="container mx-auto max-w-6xl px-4 sm:px-6">
                <p className="text-center text-sm font-medium text-muted-foreground">
                    Join practices that run on DentalCare Pro for scheduling, patients, billing, and team.
                </p>
            </LandingReveal>
        </section>
    )
}
