import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { logSecurityEvent } from "@/lib/security-logger"

const supabaseUrl: string  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Instrumented fetch ───────────────────────────────────────────────────────
// Wraps every outgoing Supabase REST call and selectively logs it to Fortress
// Insights. Auth calls (/auth/v1/*) are excluded — login logging is handled
// separately in pages/Login.tsx.
//
// To keep the brute-force detector signal-to-noise high we only log:
//   • non-GET requests (writes always),
//   • OR responses with status >= 400 (client/server errors).
//
// Successful reads are NOT logged — they're the bulk of the traffic and they
// never indicate suspicious activity on their own. This change alone removes
// ~80-95% of log volume.

function isLoggableCall(method: string, status: number): boolean {
  if (status >= 400) return true
  if (method !== "GET" && method !== "HEAD") return true
  return false
}

function createInstrumentedFetch() {
  return async (
    url: RequestInfo | URL,
    options: RequestInit = {}
  ): Promise<Response> => {
    const start = Date.now()
    const response = await fetch(url, options)
    const responseTime = Date.now() - start

    const urlString = url.toString()
    const isRestCall = urlString.includes("/rest/v1/")
    if (!isRestCall) return response

    const method = (options.method ?? "GET").toUpperCase()
    const status = response.status
    if (!isLoggableCall(method, status)) return response

    // Extract just the path from the full URL.
    let endpoint = urlString
    try {
      const parsed = new URL(urlString)
      endpoint = parsed.pathname + (parsed.search || "")
    } catch {
      // keep full URL as fallback
    }

    // Fire-and-forget — do not await so it never blocks the main request.
    logSecurityEvent({
      event_type: "api_request",
      severity: status >= 500 ? "high" : status >= 400 ? "medium" : "low",
      endpoint,
      method,
      status_code: status,
      metadata: {
        response_time: responseTime,
      },
    })

    return response
  }
}

// ─── Supabase client (with logging) ──────────────────────────────────────────

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createInstrumentedFetch(),
  },
})
