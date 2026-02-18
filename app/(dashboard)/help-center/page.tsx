import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQ_ITEMS = [
  {
    q: "How do I add a walk‑in patient?",
    a: "From the dashboard, use the floating action button (FAB) and choose \"New walk‑in\". Search for an existing patient or use \"Add as new patient\" to create one, then assign a dentist and submit. The patient is added to today's queue with a queue number.",
  },
  {
    q: "What happens when my 7‑day free trial ends?",
    a: "After 7 days you'll be redirected to Settings → Billing until you subscribe. Choose Monthly, Yearly, or Lifetime on the Billing tab to restore full access. Your data is kept; only access is locked until you subscribe.",
  },
  {
    q: "How do I check in a patient or update visit progress?",
    a: "Open the Calendar, click the appointment, and use the right-hand panel (or on mobile, the slide-out panel). Use \"Mark arrived\", \"Check In\", \"Start Treatment\", and \"Check Out\" as the patient moves through the visit.",
  },
  {
    q: "Can I change a team member's role?",
    a: "Yes, but only clinic admins and super admins can do this. Go to Settings → Team, find the member, and use the role dropdown. Changes take effect immediately.",
  },
  {
    q: "Where do I manage my subscription or payment?",
    a: "Go to Settings → Billing. If you're already subscribed, use \"Manage subscription\" or \"Open Customer Portal\" to update payment method, download invoices, or cancel. Billing is handled securely via our partner (RevenueCat).",
  },
  {
    q: "How do I contact support?",
    a: "Use Settings → Support → Suggestions & Feedback to send a message, or email socialkon10@gmail.com. For urgent issues you can call 1 (876) 255‑4848. You can also check the System Status page for uptime and contact details.",
  },
]

export default function HelpCenterPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Help Center
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Short guides and answers to the most common questions about using Dental Clinic Pro
          in your practice.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Getting started</CardTitle>
              <CardDescription>
                Set up your clinic, invite your team, and start seeing patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">1. Set up your clinic profile</p>
                <p>
                  Go to <span className="font-semibold">Settings → General</span> to add your
                  practice name, logo, contact details, and business hours. This information is
                  used across your calendar, receipts, and patient communications.
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-slate-900">2. Invite your team</p>
                <p>
                  In <span className="font-semibold">Settings → Team</span>, invite dentists,
                  hygienists, reception, and accountants. Each invite gets a temporary password
                  so they can log in and set their own credentials.
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-slate-900">3. Start booking and checking in</p>
                <p>
                  Use the calendar to book scheduled visits, or the{" "}
                  <span className="font-semibold">New walk‑in</span> flow from the dashboard FAB
                  to quickly add same‑day patients to the queue.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Visits & walk‑ins</CardTitle>
              <CardDescription>
                How the visit progress and walk‑in queue work together.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Visit progress</p>
                <p>
                  From the calendar, click an appointment to open the right‑hand visit panel.
                  Use the progress buttons to move a patient from{" "}
                  <span className="font-semibold">Arrived → Checked In → In Treatment → Complete</span>.
                  This keeps your team aligned on who is in the chair and who is waiting.
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-slate-900">Walk‑in patients</p>
                <p>
                  Use the <span className="font-semibold">New walk‑in</span> dialog to search
                  existing patients or quickly create a new patient if no match is found. Each
                  walk‑in is automatically assigned a queue number for today&apos;s date.
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-slate-900">Checking out & payments</p>
                <p>
                  When treatment is finished, click <span className="font-semibold">Check Out</span>{" "}
                  from the visit panel to open the payment/receipt flow and close the visit.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Billing & subscription</CardTitle>
              <CardDescription>Manage your plan and free trial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Free 7‑day trial</p>
                <p>
                  Every new account starts on a 7‑day free trial of Dental Clinic Pro. After
                  your trial ends, you&apos;ll be asked to subscribe on the{" "}
                  <span className="font-semibold">Settings → Billing</span> tab to keep using
                  the app.
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-slate-900">Plans & payments</p>
                <p>
                  On the Billing tab you can choose Monthly, Yearly, or Lifetime; all
                  subscriptions are handled securely through our billing partner (RevenueCat).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Need more help?</CardTitle>
              <CardDescription>Quick ways to reach us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                If you&apos;re stuck or something doesn&apos;t look right, send us a quick
                note from the{" "}
                <span className="font-semibold">Settings → Support → Suggestions & Feedback</span>{" "}
                box, or email{" "}
                <a
                  href="mailto:socialkon10@gmail.com"
                  className="font-semibold text-teal-700 underline underline-offset-2"
                >
                  socialkon10@gmail.com
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Frequently asked questions</CardTitle>
          <CardDescription>
            Quick answers to common questions about Dental Clinic Pro.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

