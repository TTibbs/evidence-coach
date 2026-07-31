import { requireUser, jsonError } from "@/lib/api/auth";
import { ensureCvExtractedText } from "@/lib/cv/recover-text";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** Load stored CV text, recovering from the original file when missing. */
export async function POST(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data: cvImport, error } = await supabase
    .from("cv_imports")
    .select(
      "id, file_path, original_filename, extracted_text, status",
    )
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !cvImport) return jsonError("CV import not found", 404);

  try {
    const { text, recovered } = await ensureCvExtractedText(supabase, cvImport);
    const { data: updated } = await supabase
      .from("cv_imports")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({
      cvImport: updated ?? { ...cvImport, extracted_text: text },
      recovered,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not recover CV text";
    return jsonError(message, 500);
  }
}
