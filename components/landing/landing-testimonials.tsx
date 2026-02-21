import { Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LandingReveal, LandingRevealStagger, LandingRevealStaggerItem } from "@/components/landing/landing-reveal"

const testimonials = [
    {
        quote: "We cut admin time in half. Scheduling and insurance in one place finally makes sense for our practice.",
        name: "Dr. Sarah Chen",
        role: "Owner, Bright Smile Dental",
    },
    {
        quote: "The referral workflow with specialists is a game-changer. No more lost paperwork or missed follow-ups.",
        name: "Michael Torres",
        role: "Practice Manager, Westside Dental",
    },
    {
        quote: "Clean, fast, and built for how we actually work. Our team adopted it in a week.",
        name: "Dr. James Okonkwo",
        role: "Partner, Riverside Family Dental",
    },
]

export function LandingTestimonials() {
    return (
        <section id="testimonials" className="relative border-b border-white/5 px-4 py-16 sm:px-6 sm:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" aria-hidden />
            <div className="container relative mx-auto max-w-6xl">
                <LandingReveal className="mb-12 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Trusted by dental practices
                    </h2>
                    <p className="mt-2 text-[hsl(213,31%,85%)]">
                        See what practice owners and managers say about DentalCare Pro.
                    </p>
                </LandingReveal>
                <LandingRevealStagger className="grid gap-6 md:grid-cols-3" staggerChildren={0.1}>
                    {testimonials.map(({ quote, name, role }) => (
                        <LandingRevealStaggerItem key={name}>
                            <Card className="relative overflow-hidden border-0 bg-white/5 shadow-none ring-1 ring-white/10 backdrop-blur-md transition-shadow hover:shadow-lg hover:-translate-y-0.5">
                                <CardContent className="p-6">
                                    <Quote className="h-8 w-8 text-primary" aria-hidden />
                                    <p className="mt-3 text-sm leading-relaxed text-[hsl(213,31%,92%)]">
                                        {quote}
                                    </p>
                                    <p className="mt-4 font-medium text-white">
                                        {name}
                                    </p>
                                    <p className="text-sm text-[hsl(213,31%,82%)]">
                                        {role}
                                    </p>
                                </CardContent>
                            </Card>
                        </LandingRevealStaggerItem>
                    ))}
                </LandingRevealStagger>
            </div>
        </section>
    )
}
