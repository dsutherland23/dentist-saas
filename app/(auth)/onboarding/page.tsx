import { Suspense } from "react"
import OnboardingContent from "./onboarding-content"

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen min-h-dvh flex items-center justify-center gradient-mesh p-4">
                <div className="h-8 w-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    )
}
