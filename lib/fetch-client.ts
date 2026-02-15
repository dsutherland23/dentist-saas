/**
 * Client fetch helper: on 401 Unauthorized, redirects to login.
 * Use for authenticated API calls so expired sessions send user to login.
 */
const LOGIN_PATH = "/login"

export async function fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const res = await fetch(input, init)
    if (res.status === 401) {
        const url = typeof window !== "undefined" ? `${window.location.origin}${LOGIN_PATH}?redirect=${encodeURIComponent(window.location.pathname)}` : LOGIN_PATH
        if (typeof window !== "undefined") {
            window.location.href = url
        }
        return res
    }
    return res
}
