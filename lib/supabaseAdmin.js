import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. This bypasses Row Level Security using the service role key.
// Only ever import this file from files under /pages/api/** — never from a
// component that ships to the browser, or the key would leak to every visitor.
export function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
