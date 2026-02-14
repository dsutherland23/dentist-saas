import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    // If Supabase is not configured, just pass through
    const hasSupabaseConfig = 
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== "" &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== "";

    if (!hasSupabaseConfig) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }

    // Supabase auth logic would go here if configured
    return NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
}
