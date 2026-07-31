import { AiProviderError, toUserFacingAiError } from "@/lib/ai/errors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, supabase, response: null };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function aiJsonError(err: unknown, status = 503) {
  const message = toUserFacingAiError(err);
  const category = err instanceof AiProviderError ? err.category : "unknown";
  return NextResponse.json({ error: message, category }, { status });
}
