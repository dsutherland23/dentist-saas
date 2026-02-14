const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

require("dotenv").config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL or SUPABASE_DB_URL is required.")
  console.error("Add it to .env.local - get it from Supabase Dashboard > Project Settings > Database > Connection string (URI)")
  process.exit(1)
}

const migrationPath = path.join(__dirname, "../supabase/migrations/20260214000004_complete_clinic_setup_rpc.sql")
const sql = fs.readFileSync(migrationPath, "utf8")

async function run() {
  const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
  try {
    await client.connect()
    await client.query(sql)
    console.log("Migration applied: complete_clinic_setup function created successfully.")
  } catch (err) {
    console.error("Migration failed:", err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
