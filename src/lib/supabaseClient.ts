import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { logSecurityEvent } from "@/lib/security-logger"

const supabaseUrl: string  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ─── Instrumented fetch ───────────────────────────────────────────────────────
// Wraps every outgoing Supabase REST call and logs it to Fortress Insights.
// Auth calls (/auth/v1/*) are excluded — login logging is handled separately.

function createInstrumentedFetch() {
  return async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
    const start = Date.now()
    const response = await fetch(url, options)
    const responseTime = Date.now() - start

    // Only log REST API calls, skip auth and storage calls
    const urlString = url.toString()
    const isRestCall = urlString.includes('/rest/v1/')

    if (isRestCall) {
      // Extract just the path from the full URL (e.g. "/rest/v1/users?select=*")
      let endpoint = urlString
      try {
        const parsed = new URL(urlString)
        endpoint = parsed.pathname + (parsed.search || '')
      } catch {
        // keep full URL as fallback
      }

      const status = response.status

      // Fire-and-forget — do not await so it never blocks the main request
      logSecurityEvent({
        event_type:  'api_request',
        severity:    status >= 500 ? 'high' : status >= 400 ? 'medium' : 'low',
        endpoint,
        method:      (options.method ?? 'GET').toUpperCase(),
        status_code: status,
        metadata: {
          response_time: responseTime,
        },
      })
    }

    return response
  }
}

// ─── Supabase client (with logging) ──────────────────────────────────────────

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createInstrumentedFetch(),
  },
})
