import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SystemStatusPage() {
  const overallStatus = "All systems operational"
  const updatedAt = new Date().toLocaleString()

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          System Status
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Live overview of Dental Clinic Pro&apos;s availability and incident history, plus how to
          reach us if something doesn&apos;t look right.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
        <div className="space-y-4">
          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Current status</CardTitle>
              <CardDescription>High‑level health across core services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{overallStatus}</p>
                  <p className="text-xs text-slate-500">Last checked: {updatedAt}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Operational
                </span>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Web app & dashboard
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Up and responsive</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Calendar, patients, billing, and settings are all available.
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Database & queue
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Healthy</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Patient records, appointments, and walk‑in queue are saving normally.
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Authentication
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">No issues</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Logins and team access are functioning as expected.
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Billing & subscriptions
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Operational</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plan changes and payments via RevenueCat are available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent incidents</CardTitle>
              <CardDescription>
                A short log of any outages or degraded performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p className="text-xs text-slate-500 italic">
                No recent incidents have been reported. If you&apos;re seeing an issue, please let
                us know using the contact details on this page so we can investigate quickly.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">How to contact us</CardTitle>
              <CardDescription>
                Use these channels if something feels slow, broken, or offline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Email</p>
                <p>
                  For non‑urgent questions or if you want to share screenshots, email{" "}
                  <a
                    href="mailto:socialkon10@gmail.com"
                    className="font-semibold text-teal-700 underline underline-offset-2"
                  >
                    socialkon10@gmail.com
                  </a>
                  .
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Phone</p>
                <p>
                  For urgent issues affecting patient care or clinic operations, call{" "}
                  <a
                    href="tel:+18762554848"
                    className="font-semibold text-teal-700 underline underline-offset-2"
                  >
                    1 (876) 255‑4848
                  </a>
                  .
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">In‑app feedback</p>
                <p>
                  You can also send us details from{" "}
                  <span className="font-semibold">Settings → Support → Suggestions & Feedback</span>.
                  Include what you were trying to do and the approximate time of the issue.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

