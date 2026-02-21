import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const ROLE_OPTIONS = ["Owner", "Practice Manager", "Dentist", "Front Desk", "Other"]
const PMS_OPTIONS = ["None", "Dentrix", "Dentrix Ascend", "Eaglesoft", "Open Dental", "Other"]
const BEST_TIME_OPTIONS = ["Morning (8–12)", "Afternoon (12–4)", "Evening (4–7)"]

function isValidRole(s: string) {
    return ROLE_OPTIONS.includes(s)
}
function isValidPms(s: string | null) {
    return s == null || s === "" || PMS_OPTIONS.includes(s)
}
function isValidBestTime(s: string | null) {
    return s == null || s === "" || BEST_TIME_OPTIONS.includes(s)
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            practice_name,
            contact_name,
            role,
            email,
            phone,
            current_pms,
            best_time,
            opt_in_updates,
            source,
        } = body

        if (
            typeof practice_name !== "string" ||
            practice_name.trim().length < 1
        ) {
            return NextResponse.json(
                { error: "Practice name is required" },
                { status: 400 }
            )
        }
        if (
            typeof contact_name !== "string" ||
            contact_name.trim().length < 1
        ) {
            return NextResponse.json(
                { error: "Your name is required" },
                { status: 400 }
            )
        }
        if (typeof role !== "string" || !isValidRole(role)) {
            return NextResponse.json(
                { error: "Please select a valid role" },
                { status: 400 }
            )
        }
        const emailStr =
            typeof email === "string" ? email.trim() : ""
        if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
            return NextResponse.json(
                { error: "Valid work email is required" },
                { status: 400 }
            )
        }
        const phoneStr =
            typeof phone === "string" ? phone.trim() : ""
        if (phoneStr.length < 5) {
            return NextResponse.json(
                { error: "Phone number is required" },
                { status: 400 }
            )
        }
        if (current_pms != null && !isValidPms(current_pms)) {
            return NextResponse.json(
                { error: "Invalid current software option" },
                { status: 400 }
            )
        }
        if (best_time != null && !isValidBestTime(best_time)) {
            return NextResponse.json(
                { error: "Invalid best time option" },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { error } = await supabase.from("demo_requests").insert({
            practice_name: practice_name.trim(),
            contact_name: contact_name.trim(),
            role,
            email: emailStr,
            phone: phoneStr,
            current_pms:
                current_pms && String(current_pms).trim() !== ""
                    ? String(current_pms).trim()
                    : null,
            best_time:
                best_time && String(best_time).trim() !== ""
                    ? String(best_time).trim()
                    : null,
            opt_in_updates: Boolean(opt_in_updates),
            source:
                typeof source === "string" && source.trim() !== ""
                    ? source.trim()
                    : null,
        })

        if (error) {
            console.error("Demo request insert error:", error)
            return NextResponse.json(
                { error: "Failed to submit request. Please try again." },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error("Demo request error:", e)
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}
