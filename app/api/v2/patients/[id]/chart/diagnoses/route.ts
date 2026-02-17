import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/v2/patients/[id]/chart/diagnoses
 * Fetch all diagnoses for a chart
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

    const { data: diagnoses, error } = await supabase
      .from('chart_diagnoses')
      .select('*')
      .eq('chart_id', chart.chart_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DIAGNOSES_V2] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch diagnoses' }, { status: 500 })
    }

    return NextResponse.json(diagnoses || [], { status: 200 })

  } catch (error) {
    console.error('[DIAGNOSES_V2] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v2/patients/[id]/chart/diagnoses
 * Create new diagnosis
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

    // Create diagnosis
    const { data: diagnosis, error: insertError } = await supabase
      .from('chart_diagnoses')
      .insert({
        chart_id: chart.chart_id,
        tooth_number: body.tooth_number,
        surface: body.surface,
        diagnosis_code: body.diagnosis_code,
        description: body.description,
        severity: body.severity,
        status: body.status || 'active',
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[DIAGNOSES_V2] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create diagnosis' }, { status: 500 })
    }

    // Log audit
    await supabase.from('chart_audit_log').insert({
      chart_id: chart.chart_id,
      user_id: user.id,
      action: 'create_diagnosis',
      entity_type: 'diagnosis',
      entity_id: diagnosis.diagnosis_id,
      after_state: diagnosis,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    return NextResponse.json(diagnosis, { status: 201 })

  } catch (error) {
    console.error('[DIAGNOSES_V2] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
