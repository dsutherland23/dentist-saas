import { use } from "react"
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EligibilityPanelClient } from "./eligibility-panel-client"

export const dynamic = "force-dynamic"

/** Unwrap params with React.use() to avoid Next.js 16 params enumeration warning (dev overlay serialization). */
export default function EligibilityPage(props: { params: Promise<{ policyId: string }> }) {
    const { policyId } = use(props.params)
    return <EligibilityPageContent policyId={policyId} />
}

async function EligibilityPageContent({ policyId }: { policyId: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .single()
    if (!userData?.clinic_id) redirect("/dashboard")

    const { data: policy, error } = await supabase
        .from("insurance_policies")
        .select(`
            *,
            provider:insurance_providers(id, name),
            patient:patients(id, first_name, last_name)
        `)
        .eq("id", policyId)
        .eq("clinic_id", userData.clinic_id)
        .single()

    if (error || !policy) {
        return (
            <div className="p-8">
                <p>Policy not found or access denied.</p>
                <Link href="/dashboard">
                    <Button variant="outline" className="mt-4">Back to Dashboard</Button>
                </Link>
            </div>
        )
    }

    const patient = policy.patient as { id: string; first_name: string; last_name: string } | null
    const provider = policy.provider as { id: string; name: string } | null

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href={patient ? `/patients/${patient.id}/insurance` : "/dashboard"}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eligibility</h1>
                    <p className="text-slate-500 text-sm">
                        {provider?.name ?? "Insurance"} — {patient ? `${patient.first_name} ${patient.last_name}` : ""}
                    </p>
                </div>
            </div>

            <EligibilityPanelClient
                policyId={policyId}
                eligibilitySnapshot={policy.eligibility_snapshot as Record<string, unknown> | null}
                verificationStatus={policy.verification_status}
                verifiedAt={policy.verified_at}
            />
        </div>
    )
}
