const ITEMS = ["Scheduling", "Patient Records", "Insurance Claims", "Clinical Referrals", "Team Planner", "Billing", "Reports", "Analytics"]

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={reverse ? "flex animate-marquee-reverse gap-8 whitespace-nowrap py-1" : "flex animate-marquee gap-8 whitespace-nowrap py-1"}>
      {[...ITEMS, ...ITEMS].map((label, i) => (
        <span key={i} className="flex items-center gap-8 text-sm text-[hsl(213,31%,82%)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {label}
        </span>
      ))}
    </div>
  )
}

export function LandingScrollBanner() {
  return (
    <section className="group border-y border-white/10 py-4" aria-hidden>
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <MarqueeRow />
      </div>
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <MarqueeRow reverse />
      </div>
    </section>
  )
}
