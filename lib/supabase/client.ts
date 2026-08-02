import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/auth-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
    },
  );
}
