import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/v2/patients/[id]/chart/periodontal
 * Fetch periodontal records for a chart
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const toothNumber = searchParams.get('tooth_number')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get chart for patient
    const { data: chart } = await supabase
      .from('dental_charts_v2')
      .select('chart_id')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('periodontal_records')
      .select('*')
      .eq('chart_id', chart.chart_id)
      .order('recorded_at', { ascending: false })

    if (toothNumber) {
      query = query.eq('tooth_number', toothNumber)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('[PERIODONTAL_V2] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
    }

    return NextResponse.json(records || [], { status: 200 })

  } catch (error) {
    console.error('[PERIODONTAL_V2] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v2/patients/[id]/chart/periodontal
 * Create new periodontal record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params
    const body = await request.json()

    // Get current user
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

    // Calculate attachment loss if not provided
    const probingDepths = body.probing_depths_mm
    const gingivalMargin = body.gingival_margin_mm
    
    let avgProbing = 0
    if (probingDepths) {
      const depths = Object.values(probingDepths) as number[]
      avgProbing = depths.reduce((a: number, b: number) => a + b, 0) / depths.length
    }
    
    let avgMargin = 0
    if (gingivalMargin) {
      const margins = Object.values(gingivalMargin) as number[]
      avgMargin = margins.reduce((a: number, b: number) => a + b, 0) / margins.length
    }

    const attachmentLoss = Math.round(avgProbing + Math.abs(avgMargin))

    // Create record
    const { data: record, error: insertError } = await supabase
      .from('periodontal_records')
      .insert({
        chart_id: chart.chart_id,
        tooth_number: body.tooth_number,
        probing_depths_mm: body.probing_depths_mm,
        bleeding_points: body.bleeding_points || [],
        gingival_margin_mm: body.gingival_margin_mm,
        recession_mm: body.recession_mm || 0,
        attachment_loss_mm: attachmentLoss,
        plaque_index: body.plaque_index,
        calculus_present: body.calculus_present || false,
        recorded_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[PERIODONTAL_V2] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    // Log audit
    await supabase.from('chart_audit_log').insert({
      chart_id: chart.chart_id,
      user_id: user.id,
      action: 'create_periodontal_record',
      entity_type: 'periodontal',
      entity_id: record.record_id,
      after_state: record,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    return NextResponse.json(record, { status: 201 })

  } catch (error) {
    console.error('[PERIODONTAL_V2] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
