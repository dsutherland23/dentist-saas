import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')

    try {
        let query = supabase
            .from('staff_schedules')
            .select('*, staff:staff_id(id, first_name, last_name, role)')
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true })

        if (staffId) {
            query = query.eq('staff_id', staffId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching staff schedules:', error)
        return NextResponse.json({ error: 'Failed to fetch staff schedules' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { staff_id, day_of_week, start_time, end_time, is_active = true } = body

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
            .from('staff_schedules')
            .insert({
                clinic_id: userData.clinic_id,
                staff_id,
                day_of_week,
                start_time,
                end_time,
                is_active
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating staff schedule:', error)
        return NextResponse.json({ error: 'Failed to create staff schedule' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { id, ...updates } = body

        const { data, error } = await supabase
            .from('staff_schedules')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error updating staff schedule:', error)
        return NextResponse.json({ error: 'Failed to update staff schedule' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
    }

    try {
        const { error } = await supabase
            .from('staff_schedules')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting staff schedule:', error)
        return NextResponse.json({ error: 'Failed to delete staff schedule' }, { status: 500 })
    }
}
