import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * PATCH /api/v2/patients/[id]/chart/surfaces/[surfaceId]
 * Update individual surface condition
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; surfaceId: string }> }
) {
  try {
    const supabase = await createClient()
    const { surfaceId } = await params
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get surface with tooth and chart info
    const { data: surface } = await supabase
      .from('tooth_surfaces')
      .select(`
        *,
        tooth:chart_teeth!inner(
          *,
          chart:dental_charts_v2!inner(*)
        )
      `)
      .eq('surface_id', surfaceId)
      .single()

    if (!surface) {
      return NextResponse.json({ error: 'Surface not found' }, { status: 404 })
    }

    // Store old state for audit
    const oldState = { ...surface }

    // Update surface
    const updateData: any = {}
    if (body.condition_type !== undefined) updateData.condition_type = body.condition_type
    if (body.condition_status !== undefined) updateData.condition_status = body.condition_status
    if (body.severity !== undefined) updateData.severity = body.severity
    if (body.material_type !== undefined) updateData.material_type = body.material_type
    if (body.color_code !== undefined) updateData.color_code = body.color_code
    if (body.diagnosis_id !== undefined) updateData.diagnosis_id = body.diagnosis_id
    if (body.treatment_plan_id !== undefined) updateData.treatment_plan_id = body.treatment_plan_id
    if (body.placed_date !== undefined) updateData.placed_date = body.placed_date
    if (body.provider_id !== undefined) updateData.provider_id = body.provider_id
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data: updated, error: updateError } = await supabase
      .from('tooth_surfaces')
      .update(updateData)
      .eq('surface_id', surfaceId)
      .select()
      .single()

    if (updateError) {
      console.error('[SURFACE_V2] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update surface' }, { status: 500 })
    }

    // Update tooth version and timestamp
    await supabase
      .from('chart_teeth')
      .update({
        version: (surface as any).tooth.version + 1,
        last_modified_at: new Date().toISOString(),
        last_modified_by: user.id
      })
      .eq('tooth_id', surface.tooth_id)

    // Update chart version
    await supabase
      .from('dental_charts_v2')
      .update({
        version: (surface as any).tooth.chart.version + 1,
        last_modified_by: user.id
      })
      .eq('chart_id', (surface as any).tooth.chart.chart_id)

    // Log audit trail
    await supabase.from('chart_audit_log').insert({
      chart_id: (surface as any).tooth.chart.chart_id,
      user_id: user.id,
      action: 'update_surface_condition',
      entity_type: 'surface',
      entity_id: surfaceId,
      before_state: oldState,
      after_state: updated,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    return NextResponse.json(updated, { status: 200 })

  } catch (error) {
    console.error('[SURFACE_V2] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
