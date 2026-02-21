import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign in | DentalCare Pro",
    description: "Sign in or create your practice account.",
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
