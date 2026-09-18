import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Uses the public anon key. Every query is still filtered by the
// Row Level Security policies defined in supabase/schema.sql —
// this key alone can never read or write data a user isn't allowed to.
export function getSupabaseBrowserClient() {
  return createBrowserSupabaseClient();
}
