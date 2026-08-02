export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

export function getSupabasePublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  return key;
}

export function getSupabaseSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }
  return key;
}
