import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { createDefaultTeeth } from "@/lib/types/dental-chart"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: patientId } = await params

        // Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's clinic_id
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
        }

        // Verify patient belongs to user's clinic
        const { data: patient } = await supabase
            .from("patients")
            .select("id, clinic_id")
            .eq("id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (!patient) {
            return NextResponse.json({ error: "Patient not found or access denied" }, { status: 404 })
        }

        // Try to get existing chart
        let { data: chart, error } = await supabase
            .from("dental_charts")
            .select("*")
            .eq("patient_id", patientId)
            .single()

        // If no chart exists, create one (lazy init)
        if (error && error.code === 'PGRST116') {
            const defaultTeeth = createDefaultTeeth()
            const { data: newChart, error: createError } = await supabase
                .from("dental_charts")
                .insert({
                    patient_id: patientId,
                    clinic_id: userData.clinic_id,
                    numbering_system: "universal",
                    chart_type: "adult_permanent",
                    version: 1,
                    teeth: defaultTeeth,
                    medical_images: [],
                    audit_log: [{
                        action: "chart_created",
                        entity_type: "dental_chart",
                        performed_by: user.id,
                        performed_at: new Date().toISOString(),
                        new_value: { status: "initialized" }
                    }]
                })
                .select()
                .single()

            if (createError) {
                console.error("[DENTAL_CHART_CREATE]", createError)
                return NextResponse.json({ error: "Failed to create chart" }, { status: 500 })
            }

            chart = newChart
        } else if (error) {
            console.error("[DENTAL_CHART_GET]", error)
            return NextResponse.json({ error: "Failed to fetch chart" }, { status: 500 })
        }

        // Map response to match schema (chart_id, practice_id)
        const response = {
            chart_id: chart.id,
            patient_id: chart.patient_id,
            practice_id: chart.clinic_id, // Map clinic_id to practice_id
            clinic_id: chart.clinic_id, // Keep clinic_id for internal use
            numbering_system: chart.numbering_system,
            chart_type: chart.chart_type,
            version: chart.version,
            is_locked: chart.is_locked,
            locked_by: chart.locked_by,
            locked_at: chart.locked_at,
            teeth: chart.teeth || [],
            medical_images: chart.medical_images || [],
            audit_log: chart.audit_log || [],
            created_at: chart.created_at,
            updated_at: chart.updated_at
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("[DENTAL_CHART_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: patientId } = await params
        const body = await request.json()

        // Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's clinic_id
        const { data: userData } = await supabase
            .from("users")
            .select("clinic_id, role")
            .eq("id", user.id)
            .single()

        if (!userData?.clinic_id) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
        }

        // Check permissions (only dentist, hygienist, clinic_admin can edit)
        if (!['dentist', 'hygienist', 'clinic_admin'].includes(userData.role)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }

        // Get existing chart
        const { data: existingChart, error: fetchError } = await supabase
            .from("dental_charts")
            .select("*")
            .eq("patient_id", patientId)
            .eq("clinic_id", userData.clinic_id)
            .single()

        if (fetchError || !existingChart) {
            return NextResponse.json({ error: "Chart not found" }, { status: 404 })
        }

        // Check if chart is locked by another user
        if (existingChart.is_locked && existingChart.locked_by && existingChart.locked_by !== user.id) {
            return NextResponse.json(
                { error: "Chart is locked by another user" },
                { status: 423 } // 423 Locked
            )
        }

        // Prepare update data
        const updateData: any = {}
        
        if (body.teeth !== undefined) updateData.teeth = body.teeth
        if (body.numbering_system !== undefined) updateData.numbering_system = body.numbering_system
        if (body.chart_type !== undefined) updateData.chart_type = body.chart_type
        if (body.medical_images !== undefined) updateData.medical_images = body.medical_images
        if (body.is_locked !== undefined) {
            updateData.is_locked = body.is_locked
            updateData.locked_by = body.is_locked ? user.id : null
            updateData.locked_at = body.is_locked ? new Date().toISOString() : null
        }

        // Increment version
        updateData.version = existingChart.version + 1

        // Append to audit log
        const newAuditEntry = {
            action: body.audit_action || "chart_updated",
            entity_type: body.audit_entity_type || "dental_chart",
            entity_id: body.audit_entity_id,
            previous_value: body.audit_previous_value,
            new_value: body.audit_new_value,
            performed_by: user.id,
            performed_at: new Date().toISOString()
        }
        
        const existingAuditLog = existingChart.audit_log || []
        updateData.audit_log = [...existingAuditLog, newAuditEntry]

        // Update chart
        const { data: updatedChart, error: updateError } = await supabase
            .from("dental_charts")
            .update(updateData)
            .eq("id", existingChart.id)
            .select()
            .single()

        if (updateError) {
            console.error("[DENTAL_CHART_UPDATE]", updateError)
            return NextResponse.json({ error: "Failed to update chart" }, { status: 500 })
        }

        // Map response
        const response = {
            chart_id: updatedChart.id,
            patient_id: updatedChart.patient_id,
            practice_id: updatedChart.clinic_id,
            clinic_id: updatedChart.clinic_id,
            numbering_system: updatedChart.numbering_system,
            chart_type: updatedChart.chart_type,
            version: updatedChart.version,
            is_locked: updatedChart.is_locked,
            locked_by: updatedChart.locked_by,
            locked_at: updatedChart.locked_at,
            teeth: updatedChart.teeth || [],
            medical_images: updatedChart.medical_images || [],
            audit_log: updatedChart.audit_log || [],
            created_at: updatedChart.created_at,
            updated_at: updatedChart.updated_at
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("[DENTAL_CHART_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
