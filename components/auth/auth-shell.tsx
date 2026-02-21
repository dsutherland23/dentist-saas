import Link from "next/link"
import { Smile } from "lucide-react"

type AuthShellProps = {
    children: React.ReactNode
    /** Optional: show logo + brand at top (e.g. on signup/login) */
    showBrand?: boolean
    /** Optional: cross-link in top-right (e.g. "Log in" on signup, "Sign up" on login) */
    topRightLink?: { href: string; label: string }
}

export function AuthShell({
    children,
    showBrand = true,
    topRightLink,
}: AuthShellProps) {
    return (
        <div className="min-h-screen min-h-dvh flex flex-col bg-[#fafbfc] relative overflow-hidden">
            {/* Subtle background: single soft gradient */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.6]"
                aria-hidden
                style={{
                    background:
                        "radial-gradient(ellipse 100% 80% at 50% -20%, hsl(var(--primary) / 0.06), transparent 60%)",
                }}
            />

            <div className="relative z-10 flex flex-1 flex-col">
                <header className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                    {showBrand ? (
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-foreground no-underline outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Smile className="h-5 w-5" aria-hidden />
                            </span>
                            <span className="font-semibold tracking-tight text-lg">
                                DentalCare Pro
                            </span>
                        </Link>
                    ) : (
                        <span />
                    )}
                    {topRightLink && (
                        <Link
                            href={topRightLink.href}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {topRightLink.label}
                        </Link>
                    )}
                </header>

                <main className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-4 sm:px-6 sm:pb-12">
                    {children}
                </main>
            </div>
        </div>
    )
}
