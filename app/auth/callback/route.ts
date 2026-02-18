import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/dashboard'

    if (errorParam) {
        const message = errorDescription
            ? encodeURIComponent(errorDescription)
            : encodeURIComponent(errorParam === 'access_denied' ? 'Sign-in was cancelled' : 'Sign-in failed')
        return NextResponse.redirect(`${origin}/login?error=${message}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        const message = encodeURIComponent(error.message || 'Could not complete sign-in')
        return NextResponse.redirect(`${origin}/login?error=${message}`)
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authorization code received')}`)
}
