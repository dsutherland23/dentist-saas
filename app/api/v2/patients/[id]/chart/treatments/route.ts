import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/v2/patients/[id]/chart/treatments
 * Fetch all treatment plans for a chart
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

    const { data: treatments, error } = await supabase
      .from('chart_treatment_plans')
      .select('*')
      .eq('chart_id', chart.chart_id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[TREATMENTS_V2] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch treatments' }, { status: 500 })
    }

    return NextResponse.json(treatments || [], { status: 200 })

  } catch (error) {
    console.error('[TREATMENTS_V2] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v2/patients/[id]/chart/treatments
 * Create new treatment plan
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

    // Create treatment plan
    const { data: treatment, error: insertError } = await supabase
      .from('chart_treatment_plans')
      .insert({
        chart_id: chart.chart_id,
        procedure_code: body.procedure_code,
        tooth_number: body.tooth_number,
        surfaces: body.surfaces || [],
        description: body.description,
        status: body.status || 'planned',
        priority: body.priority || 'medium',
        estimated_cost: body.estimated_cost,
        insurance_code: body.insurance_code,
        linked_diagnosis_id: body.linked_diagnosis_id,
        scheduled_date: body.scheduled_date,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[TREATMENTS_V2] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create treatment' }, { status: 500 })
    }

    // Log audit
    await supabase.from('chart_audit_log').insert({
      chart_id: chart.chart_id,
      user_id: user.id,
      action: 'create_treatment_plan',
      entity_type: 'treatment',
      entity_id: treatment.treatment_id,
      after_state: treatment,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    return NextResponse.json(treatment, { status: 201 })

  } catch (error) {
    console.error('[TREATMENTS_V2] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
