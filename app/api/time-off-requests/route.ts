import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const staffId = searchParams.get('staff_id')

    try {
        let query = supabase
            .from('time_off_requests')
            .select(`
                *,
                staff:staff_id(id, first_name, last_name, role, email),
                approver:approved_by(first_name, last_name)
            `)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        if (staffId) {
            query = query.eq('staff_id', staffId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching time off requests:', error)
        return NextResponse.json({ error: 'Failed to fetch time off requests' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { staff_id, start_date, end_date, reason } = body

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
            .from('time_off_requests')
            .insert({
                clinic_id: userData.clinic_id,
                staff_id,
                start_date,
                end_date,
                reason,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating time off request:', error)
        return NextResponse.json({ error: 'Failed to create time off request' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { id, status, ...updates } = body

        // Get current user for approval tracking
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const updateData: any = { ...updates }

        // If approving or rejecting, track who and when
        if (status === 'approved' || status === 'rejected') {
            updateData.status = status
            updateData.approved_by = user.id
            updateData.approved_at = new Date().toISOString()
        } else if (status) {
            updateData.status = status
        }

        const { data, error } = await supabase
            .from('time_off_requests')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                staff:staff_id(id, first_name, last_name, role, email),
                approver:approved_by(first_name, last_name)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error updating time off request:', error)
        return NextResponse.json({ error: 'Failed to update time off request' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    try {
        const { error } = await supabase
            .from('time_off_requests')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting time off request:', error)
        return NextResponse.json({ error: 'Failed to delete time off request' }, { status: 500 })
    }
}
