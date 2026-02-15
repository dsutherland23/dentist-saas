/**
 * Alternative migration runner using Supabase service role
 * Run with: node scripts/run-migration-supabase.js
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const migrationPath = path.join(__dirname, "../supabase/migrations/20260215000005_user_access_and_limits.sql")
const sql = fs.readFileSync(migrationPath, "utf8")

async function run() {
  try {
    console.log("Running migration via Supabase RPC...")
    
    // Execute the SQL via Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // If RPC doesn't exist, try direct query (this won't work in Supabase but worth trying)
      console.log("Note: This migration should be run in the Supabase SQL Editor.")
      console.log("\nTo apply this migration:")
      console.log("1. Go to: https://supabase.com/dashboard/project/_/sql")
      console.log("2. Copy the contents of: supabase/migrations/20260215000005_user_access_and_limits.sql")
      console.log("3. Paste into the SQL Editor and run it")
      console.log("\nMigration SQL:")
      console.log("---")
      console.log(sql)
      console.log("---")
      process.exit(0)
    }
    
    console.log("✓ Migration applied successfully")
  } catch (err) {
    console.error("Error:", err.message)
    console.log("\nPlease run this migration manually in Supabase SQL Editor:")
    console.log(sql)
    process.exit(1)
  }
}

run()
