import { use } from "react"
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PatientInsuranceForm } from "./patient-insurance-form"

export const dynamic = "force-dynamic"

/** Unwrap params with React.use() to avoid Next.js 16 params enumeration warning (dev overlay serialization). */
export default function PatientInsurancePage(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params)
    return <PatientInsurancePageContent patientId={id} />
}

async function PatientInsurancePageContent({ patientId }: { patientId: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .single()
    if (!userData?.clinic_id) redirect("/dashboard")

    const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, clinic_id")
        .eq("id", patientId)
        .eq("clinic_id", userData.clinic_id)
        .single()

    if (patientError || !patient) {
        return (
            <div className="p-8">
                <p>Patient not found or access denied.</p>
                <Link href="/patients">
                    <Button variant="outline" className="mt-4">Back to Patients</Button>
                </Link>
            </div>
        )
    }

    const [providersRes, policiesRes] = await Promise.all([
        supabase.from("insurance_providers").select("*").eq("clinic_id", userData.clinic_id).order("name"),
        supabase.from("insurance_policies").select(`
            *,
            provider:insurance_providers(id, name, payer_id)
        `).eq("patient_id", patientId).eq("clinic_id", userData.clinic_id).order("created_at", { ascending: false }),
    ])

    const providers = providersRes.data ?? []
    const policies = policiesRes.data ?? []

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href={`/patients/${patientId}`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Insurance</h1>
                    <p className="text-slate-500 text-sm">{patient.first_name} {patient.last_name}</p>
                </div>
            </div>

            <PatientInsuranceForm
                patientId={patientId}
                providers={providers}
                initialPolicies={policies}
            />
        </div>
    )
}
