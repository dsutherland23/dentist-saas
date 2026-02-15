const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

require("dotenv").config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL or SUPABASE_DB_URL is required.")
  process.exit(1)
}

const migrationPath = path.join(__dirname, "../supabase/migrations/20260215000005_user_access_and_limits.sql")
const sql = fs.readFileSync(migrationPath, "utf8")

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    await client.connect()
    console.log("Connected to database...")
    await client.query(sql)
    console.log("✓ Migration applied: user access and limits columns added successfully.")
  } catch (err) {
    console.error("Migration failed:", err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
