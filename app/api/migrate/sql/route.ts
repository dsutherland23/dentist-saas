import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

/** Disable in production to avoid exposing schema/SQL. Use Supabase migrations instead. */
export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 404 })
    }
    try {
        const sqlPath = join(process.cwd(), "scripts", "full-database-setup.sql")
        const sql = readFileSync(sqlPath, "utf-8")
        return NextResponse.json({ sql })
    } catch (error) {
        return NextResponse.json({ error: "Failed to read SQL file" }, { status: 500 })
    }
}
