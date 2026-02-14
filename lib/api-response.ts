import { NextResponse } from "next/server"

/**
 * Standardized API error responses (always JSON)
 */
export const ApiResponse = {
    unauthorized: (message = "Unauthorized") =>
        NextResponse.json({ error: message }, { status: 401 }),

    forbidden: (message = "Forbidden") =>
        NextResponse.json({ error: message }, { status: 403 }),

    notFound: (message = "Not found") =>
        NextResponse.json({ error: message }, { status: 404 }),

    badRequest: (message = "Bad request") =>
        NextResponse.json({ error: message }, { status: 400 }),

    internalError: (message = "Internal server error") =>
        NextResponse.json({ error: message }, { status: 500 }),

    noContent: () =>
        new NextResponse(null, { status: 204 }),

    ok: (data: any) =>
        NextResponse.json(data),
}
