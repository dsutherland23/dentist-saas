const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use service role for seeding if possible, but anon works if RLS allows

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedNotifications() {
    // Get the first clinic
    const { data: clinics } = await supabase.from('clinics').select('id').limit(1)
    if (!clinics || clinics.length === 0) {
        console.error("No clinics found to seed notifications")
        return
    }

    const clinicId = clinics[0].id

    const notifications = [
        {
            clinic_id: clinicId,
            title: "New appointment scheduled",
            message: "Sarah Johnson has a new appointment for Teeth Cleaning tomorrow at 10:00 AM.",
            type: "info",
            link: "/calendar"
        },
        {
            clinic_id: clinicId,
            title: "Payment received",
            message: "Invoice #INV-2024-001 has been marked as paid ($450.00).",
            type: "success",
            link: "/invoices"
        },
        {
            clinic_id: clinicId,
            title: "Overdue Invoice",
            message: "Invoice #INV-2024-012 for Mike Ross is now 3 days overdue.",
            type: "warning",
            link: "/invoices"
        },
        {
            clinic_id: clinicId,
            title: "Low Supplies",
            message: "Dental floss and gloves inventory is running low.",
            type: "error",
            link: "/inventory"
        }
    ]

    const { error } = await supabase.from('notifications').insert(notifications)
    if (error) {
        console.error("Error seeding notifications:", error)
    } else {
        console.log("Notifications seeded successfully")
    }
}

seedNotifications()
