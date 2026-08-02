import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/auth-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; proxy will refresh sessions.
          }
        },
      },
    },
  );
}
