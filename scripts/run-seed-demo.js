const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL or SUPABASE_DB_URL is required.");
  console.error("Add it to .env.local from Supabase Dashboard > Project Settings > Database.");
  console.error("Use the 'Direct connection' (port 5432) URI for running SQL scripts — the pooler (port 6543) can cause 'Tenant or user not found'.");
  process.exit(1);
}

const sqlPath = path.join(__dirname, "seed-demo-data.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Demo data seeded: patients, staff, appointments, specialists, and referrals.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    if (err.detail) console.error("Detail:", err.detail);
    console.error("\nIf you see 'Tenant or user not found', use Supabase SQL Editor instead:");
    console.error("  1. Dashboard > SQL Editor > New query");
    console.error("  2. Paste contents of scripts/seed-demo-data.sql");
    console.error("  3. Run");
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
