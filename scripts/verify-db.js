const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const TABLES = [
  'clinics',
  'users',
  'patients',
  'appointments',
  'treatments',
  'invoices',
  'treatment_records',
  'messages',
]

async function verify() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  console.log('Checking database tables (using anon key; some may fail due to RLS - that is ok)...\n')

  const results = {}
  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
      if (error) {
        results[table] = { ok: false, message: error.message }
      } else {
        results[table] = { ok: true }
      }
    } catch (e) {
      results[table] = { ok: false, message: e.message }
    }
  }

  let allOk = true
  for (const [table, r] of Object.entries(results)) {
    const status = r.ok ? 'OK' : 'MISSING/ERROR'
    if (!r.ok) allOk = false
    console.log(`  ${table.padEnd(22)} ${status}${r.message ? ' - ' + r.message : ''}`)
  }

  console.log('')
  if (!results.clinics?.ok) {
    console.log('>>> Database not set up. Run the SQL in Supabase SQL Editor:')
    console.log('    1. Open Supabase Dashboard > SQL Editor')
    console.log('    2. Run scripts/bootstrap-database.sql first')
    console.log('    3. Then run scripts/full-database-setup.sql')
    console.log('    Or use the /migrate page in the app to copy the SQL.')
    process.exit(1)
  }
  if (!results.users?.ok) {
    console.log('>>> users table missing. Run bootstrap-database.sql in Supabase SQL Editor.')
    process.exit(1)
  }
  if (!results.patients?.ok) {
    console.log('>>> Other tables (e.g. patients) missing. Run full-database-setup.sql in Supabase SQL Editor.')
  }
  console.log('Bootstrap tables (clinics, users) exist. App can sign up and complete onboarding.')
  if (!allOk) {
    console.log('Some tables are still missing - run full-database-setup.sql for full features.')
  }
  process.exit(0)
}

verify().catch((err) => {
  console.error(err)
  process.exit(1)
})
