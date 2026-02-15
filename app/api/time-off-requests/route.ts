import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'

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
        const { staff_id, start_date, end_date, reason, status: requestedStatus } = body

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('clinic_id, role')
            .eq('id', user.id)
            .single()

        if (!userData) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 })
        }

        const isAdmin = userData.role === 'clinic_admin' || userData.role === 'super_admin'

        if (!start_date || !end_date) {
            return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
        }
        if (new Date(end_date) < new Date(start_date)) {
            return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
        }

        let effectiveStaffId = staff_id
        let status: 'pending' | 'approved' = 'pending'

        if (isAdmin) {
            if (effectiveStaffId) {
                const { data: targetUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', effectiveStaffId)
                    .eq('clinic_id', userData.clinic_id)
                    .single()
                if (!targetUser) {
                    return NextResponse.json({ error: 'Staff member not found in your clinic' }, { status: 400 })
                }
            } else {
                effectiveStaffId = user.id
            }
            if (requestedStatus === 'approved') {
                status = 'approved'
            }
        } else {
            if (effectiveStaffId && effectiveStaffId !== user.id) {
                return NextResponse.json({ error: 'You can only submit time off for yourself' }, { status: 403 })
            }
            effectiveStaffId = user.id
        }

        const insertPayload: Record<string, unknown> = {
            clinic_id: userData.clinic_id,
            staff_id: effectiveStaffId,
            start_date,
            end_date,
            reason: reason || null,
            status,
        }
        if (status === 'approved') {
            insertPayload.approved_by = user.id
            insertPayload.approved_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('time_off_requests')
            .insert(insertPayload)
            .select(`
                *,
                staff:staff_id(id, first_name, last_name, role, email),
                approver:approved_by(first_name, last_name)
            `)
            .single()

        if (error) throw error

        if (data && status === 'approved' && effectiveStaffId && userData.clinic_id) {
            const dateRange = [start_date, end_date].filter(Boolean).join('–')
            await createNotification({
                supabase,
                clinicId: userData.clinic_id,
                userId: effectiveStaffId,
                type: 'time_off_granted',
                title: 'Time off granted',
                message: `You were granted time off for ${dateRange}.`,
                link: '/team-planner',
                actorId: user.id,
                entityType: 'time_off_request',
                entityId: data.id,
            })
        }

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

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = userData?.role === 'clinic_admin' || userData?.role === 'super_admin'

        const { data: existing } = await supabase
            .from('time_off_requests')
            .select('staff_id, status, clinic_id, start_date, end_date')
            .eq('id', id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Time off request not found' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = { ...updates }

        if (status === 'approved' || status === 'rejected') {
            if (!isAdmin) {
                return NextResponse.json({ error: 'Only admins can approve or reject requests' }, { status: 403 })
            }
            updateData.status = status
            updateData.approved_by = user.id
            updateData.approved_at = new Date().toISOString()
        } else if (status === 'cancelled') {
            if (!isAdmin && existing.staff_id !== user.id) {
                return NextResponse.json({ error: 'You can only cancel your own request' }, { status: 403 })
            }
            if (existing.status !== 'pending') {
                return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 400 })
            }
            updateData.status = 'cancelled'
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

        const dateRange = existing.start_date && existing.end_date
            ? `${existing.start_date}–${existing.end_date}`
            : 'your requested dates'

        if (status === 'approved' && existing.clinic_id) {
            await createNotification({
                supabase,
                clinicId: existing.clinic_id,
                userId: existing.staff_id,
                type: 'time_off_approved',
                title: 'Time off approved',
                message: `Your request for ${dateRange} was approved.`,
                link: '/team-planner',
                actorId: user.id,
                entityType: 'time_off_request',
                entityId: id,
            })
        } else if (status === 'rejected' && existing.clinic_id) {
            await createNotification({
                supabase,
                clinicId: existing.clinic_id,
                userId: existing.staff_id,
                type: 'time_off_rejected',
                title: 'Time off not approved',
                message: `Your request for ${dateRange} was declined.`,
                link: '/team-planner',
                actorId: user.id,
                entityType: 'time_off_request',
                entityId: id,
            })
        }

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
