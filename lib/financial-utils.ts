/**
 * Financial Utilities for Dashboard Calculations
 * Handles AR aging, collection rates, production values, and forecasting
 */

export interface ARAgingBucket {
    bucket: 'current' | '0-30' | '31-60' | '61-90' | '90+'
    count: number
    amount: number
}

export interface CollectionMetrics {
    totalBilled: number
    totalCollected: number
    collectionRate: number
    outstandingBalance: number
}

export interface ProductionMetrics {
    todayProduction: number
    mtdProduction: number
    scheduledProduction: number
}

/**
 * Calculate AR aging buckets from invoice data
 */
export function calculateARAging(invoices: any[]): ARAgingBucket[] {
    const buckets: Record<string, ARAgingBucket> = {
        'current': { bucket: 'current', count: 0, amount: 0 },
        '0-30': { bucket: '0-30', count: 0, amount: 0 },
        '31-60': { bucket: '31-60', count: 0, amount: 0 },
        '61-90': { bucket: '61-90', count: 0, amount: 0 },
        '90+': { bucket: '90+', count: 0, amount: 0 },
    }

    invoices.forEach(invoice => {
        const balanceDue = parseFloat(invoice.balance_due || 0)
        if (balanceDue <= 0) return

        const daysOverdue = invoice.days_past_due || 0
        let bucket: string

        if (daysOverdue === 0) {
            bucket = 'current'
        } else if (daysOverdue <= 30) {
            bucket = '0-30'
        } else if (daysOverdue <= 60) {
            bucket = '31-60'
        } else if (daysOverdue <= 90) {
            bucket = '61-90'
        } else {
            bucket = '90+'
        }

        buckets[bucket].count++
        buckets[bucket].amount += balanceDue
    })

    return Object.values(buckets)
}

/**
 * Calculate collection rate metrics
 */
export function calculateCollectionMetrics(
    invoices: any[],
    payments: any[]
): CollectionMetrics {
    const totalBilled = invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total_amount || 0),
        0
    )

    const totalCollected = payments.reduce(
        (sum, pay) => sum + parseFloat(pay.amount_paid || 0),
        0
    )

    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0

    const outstandingBalance = invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.balance_due || 0),
        0
    )

    return {
        totalBilled,
        totalCollected,
        collectionRate,
        outstandingBalance,
    }
}

/**
 * Calculate production values from appointments
 */
export function calculateProductionFromAppointments(
    appointments: any[],
    treatments: any[]
): number {
    // Create a map of treatment prices
    const treatmentPrices = new Map(
        treatments.map(t => [t.id, parseFloat(t.price || 0)])
    )

    return appointments.reduce((sum, apt) => {
        // Try to find matching treatment by ID or name
        const treatment = treatments.find(
            t => t.id === apt.treatment_id || t.name === apt.treatment_type
        )

        if (treatment) {
            return sum + parseFloat(treatment.price || 0)
        }

        // Fallback: if appointment has a value field, use that
        if (apt.estimated_value) {
            return sum + parseFloat(apt.estimated_value)
        }

        return sum
    }, 0)
}

/**
 * Forecast upcoming revenue based on scheduled appointments
 */
export function forecastUpcomingRevenue(
    appointments: any[],
    treatments: any[],
    insuranceCoverage: number = 0.7 // Average insurance coverage %
): {
    scheduledRevenue: number
    estimatedInsurancePortion: number
    estimatedPatientPortion: number
} {
    const scheduledRevenue = calculateProductionFromAppointments(appointments, treatments)
    const estimatedInsurancePortion = scheduledRevenue * insuranceCoverage
    const estimatedPatientPortion = scheduledRevenue * (1 - insuranceCoverage)

    return {
        scheduledRevenue,
        estimatedInsurancePortion,
        estimatedPatientPortion,
    }
}

/**
 * Calculate unscheduled treatment plan value
 */
export function calculateUnscheduledTreatmentValue(treatmentPlans: any[]): {
    total: number
    byStatus: Record<string, number>
    highValuePatients: Array<{ patient_id: string; patient_name: string; value: number }>
} {
    let total = 0
    const byStatus: Record<string, number> = {}
    const patientValues = new Map<string, { patient_name: string; value: number; patient_id: string }>()

    treatmentPlans.forEach(plan => {
        // Only count accepted or proposed plans that haven't been scheduled
        if (plan.status === 'accepted' || plan.status === 'proposed') {
            // Sum up items that are not_started or not linked to appointments
            const items = plan.items || []
            const unscheduledValue = items
                .filter((item: any) => !item.appointment_id && item.status === 'not_started')
                .reduce((sum: number, item: any) => sum + parseFloat(item.total_price || 0), 0)

            if (unscheduledValue > 0) {
                total += unscheduledValue
                byStatus[plan.status] = (byStatus[plan.status] || 0) + unscheduledValue

                // Track per patient
                const patientKey = plan.patient_id
                const existing = patientValues.get(patientKey)
                if (existing) {
                    existing.value += unscheduledValue
                } else {
                    patientValues.set(patientKey, {
                        patient_name: plan.patient_name || 'Unknown',
                        value: unscheduledValue,
                        patient_id: plan.patient_id,
                    })
                }
            }
        }
    })

    // Sort patients by value and get top high-value ones
    const highValuePatients = Array.from(patientValues.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10

    return {
        total,
        byStatus,
        highValuePatients,
    }
}

/**
 * Calculate treatment plan acceptance rate
 */
export function calculateTreatmentAcceptanceRate(treatmentPlans: any[]): {
    totalProposed: number
    totalAccepted: number
    acceptanceRate: number
    totalDeclined: number
} {
    const totalProposed = treatmentPlans.filter(
        p => p.status === 'proposed' || p.status === 'accepted' || p.status === 'declined'
    ).length

    const totalAccepted = treatmentPlans.filter(p => p.status === 'accepted').length
    const totalDeclined = treatmentPlans.filter(p => p.status === 'declined').length

    const acceptanceRate = totalProposed > 0 ? (totalAccepted / totalProposed) * 100 : 0

    return {
        totalProposed,
        totalAccepted,
        acceptanceRate,
        totalDeclined,
    }
}

/**
 * Calculate days past due for an invoice
 */
export function calculateDaysPastDue(dueDate: Date | string | null, status: string): number {
    if (status === 'paid' || status === 'cancelled' || !dueDate) {
        return 0
    }

    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
}

/**
 * Calculate average days to payment for insurance claims
 */
export function calculateAvgDaysToPayment(claims: any[]): number {
    const paidClaims = claims.filter(c => c.status === 'paid' && c.submitted_at && c.updated_at)

    if (paidClaims.length === 0) return 0

    const totalDays = paidClaims.reduce((sum, claim) => {
        const submitted = new Date(claim.submitted_at)
        const paid = new Date(claim.updated_at)
        const diffTime = paid.getTime() - submitted.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return sum + diffDays
    }, 0)

    return Math.round(totalDays / paidClaims.length)
}

/**
 * Generate smart insights based on data
 */
export function generateSmartInsights(data: {
    treatmentPlans: any[]
    appointments: any[]
    invoices: any[]
    claims: any[]
}): string[] {
    const insights: string[] = []

    // High-value unscheduled treatments
    const unscheduled = calculateUnscheduledTreatmentValue(data.treatmentPlans)
    if (unscheduled.highValuePatients.length > 0) {
        const topPatient = unscheduled.highValuePatients[0]
        insights.push(
            `${topPatient.patient_name} has ${formatCurrency(topPatient.value)} in unscheduled treatment`
        )
    }

    // Overdue invoices
    const overdueInvoices = data.invoices.filter(
        inv => inv.status !== 'paid' && calculateDaysPastDue(inv.due_date, inv.status) > 30
    )
    if (overdueInvoices.length > 0) {
        const overdueAmount = overdueInvoices.reduce(
            (sum, inv) => sum + parseFloat(inv.balance_due || 0),
            0
        )
        insights.push(
            `${overdueInvoices.length} invoices overdue with ${formatCurrency(overdueAmount)} outstanding`
        )
    }

    // Claims pending too long
    const longPendingClaims = data.claims.filter(c => {
        if (c.status !== 'pending') return false
        const submitted = new Date(c.submitted_at)
        const today = new Date()
        const daysPending = Math.floor((today.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
        return daysPending > 14
    })
    if (longPendingClaims.length > 0) {
        insights.push(
            `${longPendingClaims.length} insurance claims pending over 14 days`
        )
    }

    // Today's no-shows
    const todayNoShows = data.appointments.filter(
        apt => apt.status === 'no_show' && new Date(apt.start_time).toDateString() === new Date().toDateString()
    )
    if (todayNoShows.length > 0) {
        insights.push(`${todayNoShows.length} no-shows today - consider follow-up calls`)
    }

    return insights
}
