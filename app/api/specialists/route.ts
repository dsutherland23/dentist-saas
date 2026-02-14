import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET /api/specialists - List specialists with optional filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const specialty = searchParams.get("specialty")
        const city = searchParams.get("city")
        const parish = searchParams.get("parish")
        const country = searchParams.get("country")
        const search = searchParams.get("search")
        const includeAll = searchParams.get("includeAll") === "true" // For admin to view pending
        const myProfile = searchParams.get("myProfile") === "true"

        const supabase = await createClient()

        let query = supabase
            .from("specialists")
            .select(`
                *,
                specialty:specialties(id, name)
            `)

        // Filter by approval status
        if (myProfile) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            query = query.eq("user_id", user.id)
        } else if (!includeAll) {
            query = query.eq("status", "approved")
        }

        // Apply filters
        if (specialty) {
            query = query.eq("specialty_id", specialty)
        }
        if (city) {
            query = query.ilike("city", `%${city}%`)
        }
        if (parish) {
            query = query.ilike("parish", `%${parish}%`)
        }
        if (country) {
            query = query.ilike("country", `%${country}%`)
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,clinic_name.ilike.%${search}%,bio.ilike.%${search}%`)
        }

        query = query.order("name", { ascending: true })

        const { data: specialists, error } = await query

        if (error) throw error

        return NextResponse.json(specialists || [])
    } catch (error) {
        console.error("[SPECIALISTS_GET]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/specialists - Create specialist (self-registration or admin-add)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            specialty_id,
            license_number,
            clinic_name,
            address,
            city,
            parish,
            country,
            lat,
            lng,
            phone,
            email,
            website,
            bio,
            credentials_url,
            adminAdd
        } = body

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()

        const isAdmin = userData?.role === "clinic_admin" || userData?.role === "super_admin"

        if (adminAdd && isAdmin) {
            // Admin adding a specialist directly — user_id null, auto-approved
            if (!name || !specialty_id) {
                return NextResponse.json({ error: "Name and specialty are required" }, { status: 400 })
            }
            const defaultLat = lat ?? 18.1096
            const defaultLng = lng ?? -77.2975

            const { data: newSpecialist, error } = await supabase
                .from("specialists")
                .insert({
                    user_id: null,
                    name,
                    specialty_id,
                    license_number: license_number || null,
                    clinic_name: clinic_name || null,
                    address: address || null,
                    city: city || null,
                    parish: parish || null,
                    country: country || "Jamaica",
                    lat: defaultLat,
                    lng: defaultLng,
                    phone: phone || null,
                    email: email || null,
                    website: website || null,
                    bio: bio || null,
                    credentials_url: credentials_url || null,
                    status: "approved"
                })
                .select(`
                    *,
                    specialty:specialties(id, name)
                `)
                .single()

            if (error) {
                console.error("[SPECIALISTS_POST_ADMIN_ERROR]", error)
                return NextResponse.json({ error: error.message }, { status: 400 })
            }
            return NextResponse.json(newSpecialist)
        }

        // Self-registration (requires RLS policy "Users can register themselves as specialist")
        if (!name || !specialty_id || !lat || !lng) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data: newSpecialist, error } = await supabase
            .from("specialists")
            .insert({
                user_id: user.id,
                name,
                specialty_id,
                license_number: license_number || null,
                clinic_name: clinic_name || null,
                address: address || null,
                city: city || null,
                parish: parish || null,
                country: country || "Jamaica",
                lat,
                lng,
                phone: phone || null,
                email: email || null,
                website: website || null,
                bio: bio || null,
                credentials_url: credentials_url || null,
                status: "pending",
            })
            .select(`
                *,
                specialty:specialties(id, name)
            `)
            .single()

        if (error) {
            console.error("[SPECIALISTS_POST_ERROR]", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(newSpecialist)
    } catch (error) {
        console.error("[SPECIALISTS_POST]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PATCH /api/specialists - Update specialist (admin or owner)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: "Missing Specialist ID" }, { status: 400 })
        }

        // Check permissions: must be admin or the specialist owner
        const { data: specialist } = await supabase
            .from("specialists")
            .select("user_id")
            .eq("id", id)
            .single()

        const isAdmin = userData?.role === 'clinic_admin' || userData?.role === 'super_admin'
        const isOwner = specialist?.user_id === user.id

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: updatedSpecialist, error } = await supabase
            .from("specialists")
            .update(updates)
            .eq("id", id)
            .select(`
                *,
                specialty:specialties(id, name)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(updatedSpecialist)
    } catch (error) {
        console.error("[SPECIALISTS_PATCH]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/specialists - Delete specialist (admin only)
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()

        if (userData?.role !== 'clinic_admin' && userData?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const specialistId = searchParams.get("id")

        if (!specialistId) {
            return NextResponse.json({ error: "Missing Specialist ID" }, { status: 400 })
        }

        const { error } = await supabase
            .from("specialists")
            .delete()
            .eq("id", specialistId)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[SPECIALISTS_DELETE]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
