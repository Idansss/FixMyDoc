import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * Use only in API routes and server code. Do not import from client components.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
let _server: SupabaseClient | null = null;

function getSupabaseServer(): SupabaseClient {
  if (_server) return _server;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      _server = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { persistSession: false },
      });
      return _server;
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _server = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _server;
}

export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseServer();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
