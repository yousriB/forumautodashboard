// supabase/functions/security-log/index.ts
//
// Change from v7: the client IP is taken ONLY from the request headers set by
// the Supabase edge proxy. A caller-supplied `body.ip_address` is ignored, so
// attackers can no longer forge the IP recorded in security_logs /
// login_attempts / api_requests (or get an innocent IP blocked).
// Severity is restricted to known values, text fields are length-capped, and
// internal error messages are no longer returned to the caller.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SEVERITIES = ['low', 'medium', 'high', 'critical']
const cap = (v: unknown, n: number) => (v == null ? null : String(v).slice(0, n))

function clientIp(req: Request): string | null {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    null
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const text = await req.text()
    if (text.length > 16_000) return json(413, { error: 'Payload too large' })
    let body: Record<string, any>
    try {
      body = JSON.parse(text)
    } catch {
      return json(400, { error: 'Invalid JSON' })
    }

    if (!body.app_id || !body.event_type) {
      return json(400, { error: 'Missing required fields: app_id and event_type' })
    }

    const requestIP = clientIp(req)
    const requestUserAgent = cap(req.headers.get('user-agent') ?? body.user_agent, 500)
    const severity = SEVERITIES.includes(body.severity) ? body.severity : 'low'
    const statusCode = Number.isInteger(body.status_code) ? body.status_code : null

    const { data, error } = await supabase
      .from('security_logs')
      .insert({
        app_id: body.app_id,
        event_type: cap(body.event_type, 64),
        severity,
        user_id: body.user_id || null,
        ip_address: requestIP,
        endpoint: cap(body.endpoint, 500),
        method: cap(body.method, 10),
        status_code: statusCode,
        user_agent: requestUserAgent,
        metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : null,
      })
      .select('id')

    if (error) throw error

    if (body.event_type === 'login_attempt') {
      await supabase.from('login_attempts').insert({
        app_id: body.app_id,
        email: cap(body.metadata?.email, 254),
        ip_address: requestIP,
        success: statusCode === 200,
        user_agent: requestUserAgent,
        risk_score: statusCode === 200 ? 0.1 : 0.5,
      })
    }

    if (body.event_type === 'api_request') {
      await supabase.from('api_requests').insert({
        app_id: body.app_id,
        endpoint: cap(body.endpoint, 500),
        method: cap(body.method, 10),
        ip_address: requestIP,
        response_time: Number(body.metadata?.response_time) || null,
        status_code: statusCode,
        request_size: Number(body.metadata?.request_size) || null,
      })
    }

    return json(200, { success: true, id: data?.[0]?.id })
  } catch (err) {
    console.error('security-log error:', err)
    return json(500, { error: 'Internal error' })
  }
})
