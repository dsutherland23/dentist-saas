import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware";

// Next.js only invokes middleware from a root file named middleware.ts
// exporting a function named "middleware". This ensures auth/session runs.
export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
