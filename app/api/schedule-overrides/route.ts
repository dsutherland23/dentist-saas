import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const date = searchParams.get('date')

    try {
        let query = supabase
            .from('staff_schedule_overrides')
            .select('*, staff:staff_id(id, first_name, last_name, role)')
            .order('override_date', { ascending: true })

        if (staffId) {
            query = query.eq('staff_id', staffId)
        }

        if (date) {
            query = query.eq('override_date', date)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching schedule overrides:', error)
        return NextResponse.json({ error: 'Failed to fetch schedule overrides' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { staff_id, override_date, start_time, end_time, is_available, reason } = body

        // Get clinic_id from authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('clinic_id')
            .eq('id', user.id)
            .single()

        if (!userData) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('staff_schedule_overrides')
            .insert({
                clinic_id: userData.clinic_id,
                staff_id,
                override_date,
                start_time,
                end_time,
                is_available,
                reason
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating schedule override:', error)
        return NextResponse.json({ error: 'Failed to create schedule override' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { id, ...updates } = body

        const { data, error } = await supabase
            .from('staff_schedule_overrides')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error updating schedule override:', error)
        return NextResponse.json({ error: 'Failed to update schedule override' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Override ID required' }, { status: 400 })
    }

    try {
        const { error } = await supabase
            .from('staff_schedule_overrides')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting schedule override:', error)
        return NextResponse.json({ error: 'Failed to delete schedule override' }, { status: 500 })
    }
}
