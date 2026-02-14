"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy, ExternalLink, Database, AlertCircle, ListOrdered } from "lucide-react"
import { toast } from "sonner"

type Step = "bootstrap" | "full"

export default function MigratePage() {
    const [step, setStep] = useState<Step>("bootstrap")
    const [copied, setCopied] = useState(false)
    const [sql, setSql] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const path = step === "bootstrap" ? "/api/migrate/bootstrap" : "/api/migrate/sql"
        setLoading(true)
        fetch(path)
            .then((r) => r.json())
            .then((d) => { setSql(d.sql || ""); setLoading(false) })
            .catch(() => { setLoading(false) })
    }, [step])

    const handleCopy = async () => {
        if (!sql) return
        await navigator.clipboard.writeText(sql)
        setCopied(true)
        toast.success(step === "bootstrap" ? "Bootstrap SQL copied!" : "Full setup SQL copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    const supabaseSqlUrl = "https://supabase.com/dashboard/project/_/sql/new"

    return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4 sm:p-6">
            <Card className="w-full max-w-2xl glass border-0 shadow-2xl shadow-slate-200/50">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400 rounded-t-lg" />
                <CardHeader className="space-y-2 pb-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                            <Database className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Database Setup</CardTitle>
                            <CardDescription>
                                Run the SQL below in Supabase — the database is not created automatically
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 px-4 sm:px-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">You must run the SQL yourself</p>
                            <p className="mt-1 text-amber-700">Open your Supabase project → SQL Editor → paste the script → Run. No automatic migration runs from this app.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setStep("bootstrap")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${step === "bootstrap" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            <ListOrdered className="h-4 w-4" />
                            Step 1: Bootstrap
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep("full")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${step === "full" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            <Database className="h-4 w-4" />
                            Step 2: Full setup
                        </button>
                    </div>

                    <p className="text-sm text-slate-600">
                        {step === "bootstrap" ? (
                            <>Step 1 creates <strong>clinics</strong> and <strong>users</strong> tables plus the onboarding function. Run this first, then sign up and complete onboarding.</>
                        ) : (
                            <>Step 2 creates all other tables (patients, appointments, treatments, invoices, etc.). Run after Step 1.</>
                        )}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleCopy} className="flex-1 min-w-[160px] h-12 gradient-primary text-white font-bold" disabled={loading || !sql}>
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            {loading ? "Loading..." : copied ? "Copied!" : `Copy ${step === "bootstrap" ? "Bootstrap" : "Full"} SQL`}
                        </Button>
                        <Button variant="outline" className="h-12" asChild>
                            <a href={supabaseSqlUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open SQL Editor
                            </a>
                        </Button>
                    </div>

                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
                        <li className="font-medium">Copy the SQL above (Step 1 or Step 2)</li>
                        <li className="font-medium">Open your <strong>Supabase Dashboard</strong> → <strong>SQL Editor</strong></li>
                        <li className="font-medium">Paste and click <strong>Run</strong></li>
                        <li className="font-medium">Run Step 1 first; then run Step 2. Return to the app and refresh.</li>
                    </ol>

                    <p className="text-xs text-slate-500">
                        To check if tables exist: run <code className="bg-slate-200 px-1 rounded">npm run db:verify</code> in the project folder.
                    </p>

                    {sql && (
                        <details className="group">
                            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 font-medium">
                                Preview SQL ({sql.split("\n").length} lines)
                            </summary>
                            <pre className="mt-2 p-4 bg-slate-900 text-slate-100 text-xs rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                                <code>{sql}</code>
                            </pre>
                        </details>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
