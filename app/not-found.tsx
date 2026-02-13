import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Stethoscope, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="mb-8 relative">
                <div className="h-24 w-24 bg-teal-100 rounded-full flex items-center justify-center animate-pulse">
                    <Stethoscope className="h-12 w-12 text-teal-600" />
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    404
                </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-2">Page Not Found</h1>
            <p className="text-slate-500 max-w-md mb-8">
                Oops! It seems like the page you're looking for has been moved or doesn't exist.
                Let's get you back to the right path.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline" className="border-slate-200">
                    <Link href="javascript:history.back()" className="flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Link>
                </Button>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link href="/dashboard" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>

            <div className="mt-16 text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Dental SaaS Platform. All rights reserved.</p>
            </div>
        </div>
    )
}
