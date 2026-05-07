import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, SUPABASE_CONFIGURED } from '@/lib/env';

let _client: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!SUPABASE_CONFIGURED) {
    throw new Error(
      'adminClient unavailable: SUPABASE env vars not set. See .env.example.',
    );
  }
  if (_client) return _client;
  _client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
