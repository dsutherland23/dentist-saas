import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/v2/patients/[id]/chart
 * Fetch complete dental chart with all nested data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's clinic
    const { data: profile } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single()

    if (!profile?.clinic_id) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 })
    }

    // Check if patient exists and belongs to this clinic
    const { data: patient } = await supabase
      .from('patients')
      .select('id, clinic_id')
      .eq('id', patientId)
      .eq('clinic_id', profile.clinic_id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Get or create chart
    let { data: chart } = await supabase
      .from('dental_charts_v2')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    // If no chart exists, lazy-initialize one
    if (!chart) {
      // Create chart
      const { data: newChart, error: chartError } = await supabase
        .from('dental_charts_v2')
        .insert({
          patient_id: patientId,
          practice_id: profile.clinic_id,
          chart_type: 'adult_permanent',
          numbering_system: 'FDI',
          created_by: user.id,
          last_modified_by: user.id
        })
        .select()
        .single()

      if (chartError || !newChart) {
        return NextResponse.json({ error: 'Failed to create chart' }, { status: 500 })
      }

      // Initialize teeth using database function
      const { error: initError } = await supabase.rpc('initialize_chart_teeth', {
        p_chart_id: newChart.chart_id,
        p_numbering_system: 'FDI',
        p_user_id: user.id
      })

      if (initError) {
        console.error('[CHART_V2] Failed to initialize teeth:', initError)
        return NextResponse.json({ error: 'Failed to initialize teeth' }, { status: 500 })
      }

      chart = newChart
    }

    // Fetch complete chart with all nested data using function
    const { data: fullChart, error: fetchError } = await supabase
      .rpc('get_chart_with_full_details', { p_chart_id: chart.chart_id })

    if (fetchError) {
      console.error('[CHART_V2] Failed to fetch full chart:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch chart details' }, { status: 500 })
    }

    return NextResponse.json(fullChart, { status: 200 })

  } catch (error) {
    console.error('[CHART_V2] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/v2/patients/[id]/chart
 * Update chart metadata
 */
export async function PATCH(
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
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 })
    }

    // Update chart
    const { data: updated, error: updateError } = await supabase
      .from('dental_charts_v2')
      .update({
        numbering_system: body.numbering_system || chart.numbering_system,
        preferred_numbering_system: body.preferred_numbering_system || chart.preferred_numbering_system,
        version: chart.version + 1,
        last_modified_by: user.id
      })
      .eq('chart_id', chart.chart_id)
      .select()
      .single()

    if (updateError) {
      console.error('[CHART_V2] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update chart' }, { status: 500 })
    }

    // Log audit trail
    await supabase.from('chart_audit_log').insert({
      chart_id: chart.chart_id,
      user_id: user.id,
      action: 'update_chart_metadata',
      entity_type: 'chart',
      entity_id: chart.chart_id,
      before_state: chart,
      after_state: updated,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    // Fetch full chart
    const { data: fullChart } = await supabase
      .rpc('get_chart_with_full_details', { p_chart_id: chart.chart_id })

    return NextResponse.json(fullChart, { status: 200 })

  } catch (error) {
    console.error('[CHART_V2] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
