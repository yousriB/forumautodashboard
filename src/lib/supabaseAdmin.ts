import { createClient } from '@supabase/supabase-js';

// ─── Admin Supabase client ────────────────────────────────────────────────────
// Uses the service role key which bypasses Row Level Security and has
// permission to manage auth.users (create, delete, etc.).
//
// ⚠️  Only import this in server-side or trusted admin-only code paths.
//     Never expose the service role key to end users.

const supabaseUrl   = import.meta.env.VITE_SUPABASE_URL  as string;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
});
