import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/auth";

/** List the current user's CV imports (newest first). */
export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("cv_imports")
    .select(
      "id, original_filename, status, created_at, confirmed_at, extracted_text",
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ imports: data ?? [] });
}
