import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, email, clinicName, adminName } = body

        if (!userId || !email || !clinicName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Use server client (cookies-based) or create a fresh one just for this call
        // Since we are calling from the client side after signup, we might not have the session cookie set yet in this request context perfectly, 
        // OR we can just use a basic client.
        // Actually, calling RPC requires us to be authenticated if we want to rely on `auth.uid()` inside, but here we pass `p_user_id` explicitly.
        // But `SECURITY DEFINER` functions run with elevated privileges anyway.

        // We'll use the basic createClient from lib/supabase (client-side capable) or strict server one.
        // Let's use a fresh client with the ANON key, as the RPC handles the privs.
        const { createClient: createClientJs } = require('@supabase/supabase-js')
        const supabase = createClientJs(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error } = await supabase.rpc('create_clinic_and_admin', {
            p_clinic_name: clinicName,
            p_admin_name: adminName,
            p_admin_email: email,
            p_user_id: userId
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data.success) {
            console.error('Onboarding Failed:', data.error)
            return NextResponse.json({ error: data.error }, { status: 500 })
        }

        return NextResponse.json({ success: true, clinicId: data.clinic_id })

    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
