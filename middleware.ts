// middleware.ts (Vercel Edge Middleware)
//
// This file is detected automatically by Vercel and runs at the edge BEFORE
// any static asset (index.html / bundled JS) is served. It enforces the
// IP-block list from public.blocked_ips in Supabase.
//
// Required Vercel env vars:
//   - SUPABASE_URL          (or VITE_SUPABASE_URL)
//   - SUPABASE_ANON_KEY     (or VITE_SUPABASE_ANON_KEY)
//
// Matching: every path except static assets. The vercel.json SPA rewrite
// (* -> /index.html) runs AFTER this middleware, so the block applies to
// all client routes.

import { isIpBlocked, extractClientIp, BLOCKED_HTML } from './api/_ip-block'

export const config = {
  matcher: [
    // Match everything except files with an extension (static assets)
    '/((?!.*\\..*).*)',
  ],
}

export default async function middleware(req: Request): Promise<Response | undefined> {
  const ip = extractClientIp(req)
  if (ip && (await isIpBlocked(ip))) {
    return new Response(BLOCKED_HTML, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Blocked-Reason': 'ip_blocked',
      },
    })
  }
  // Returning undefined continues the normal request flow.
  return undefined
}
