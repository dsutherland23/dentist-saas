import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
    try {
        const sqlPath = join(process.cwd(), "scripts", "bootstrap-database.sql")
        const sql = readFileSync(sqlPath, "utf-8")
        return NextResponse.json({ sql })
    } catch (error) {
        return NextResponse.json({ error: "Failed to read SQL file" }, { status: 500 })
    }
}
