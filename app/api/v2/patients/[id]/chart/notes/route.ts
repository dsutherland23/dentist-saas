import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/v2/patients/[id]/chart/notes
 * Fetch clinical notes for a chart
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get chart
    const { data: chart } = await supabase
      .from('dental_charts_v2')
      .select('chart_id')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 })
    }

    const { data: notes, error } = await supabase
      .from('chart_clinical_notes')
      .select('*')
      .eq('chart_id', chart.chart_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[NOTES_V2] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json(notes || [], { status: 200 })

  } catch (error) {
    console.error('[NOTES_V2] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v2/patients/[id]/chart/notes
 * Create new clinical note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get chart
    const { data: chart } = await supabase
      .from('dental_charts_v2')
      .select('chart_id')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 })
    }

    // Create note
    const { data: note, error: insertError } = await supabase
      .from('chart_clinical_notes')
      .insert({
        chart_id: chart.chart_id,
        note_type: body.note_type,
        content: body.content,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[NOTES_V2] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    // Log audit
    await supabase.from('chart_audit_log').insert({
      chart_id: chart.chart_id,
      user_id: user.id,
      action: 'create_clinical_note',
      entity_type: 'note',
      entity_id: note.note_id,
      after_state: note,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    return NextResponse.json(note, { status: 201 })

  } catch (error) {
    console.error('[NOTES_V2] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
