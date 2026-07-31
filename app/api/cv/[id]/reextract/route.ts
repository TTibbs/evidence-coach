import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { ensureCvExtractedText } from "@/lib/cv/recover-text";
import { extractCvFromText } from "@/lib/ai/extract-cv";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  try {
    await assertWithinLimit(user!.id, "cv_import");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const body = await request.json().catch(() => ({}));
  const textOverride =
    typeof body?.extractedText === "string" ? body.extractedText.trim() : null;

  const { data: cvImport, error } = await supabase
    .from("cv_imports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !cvImport) return jsonError("CV import not found", 404);

  let text = textOverride || "";
  if (!text) {
    try {
      const recovered = await ensureCvExtractedText(supabase, {
        ...cvImport,
        extracted_text: cvImport.extracted_text,
      });
      text = recovered.text;
    } catch (err) {
      return jsonError(
        err instanceof Error
          ? err.message
          : "No CV text available. Paste text and save first.",
      );
    }
  }

  await supabase
    .from("cv_imports")
    .update({
      status: "processing",
      error_message: null,
      extracted_text: text,
    })
    .eq("id", id);

  try {
    const draft = await extractCvFromText(text, user!.id);
    const { data: updated, error: updateError } = await supabase
      .from("cv_imports")
      .update({
        status: "ready_for_review",
        extracted_draft: draft,
        extracted_text: text,
        error_message: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    await recordUsage(user!.id, "cv_import", 1, {
      cvImportId: id,
      reextract: true,
    });

    return NextResponse.json({ cvImport: updated });
  } catch (err) {
    const message =
      err instanceof AiProviderError
        ? err.userMessage
        : err instanceof Error
          ? err.message
          : "CV re-extraction failed";
    await supabase
      .from("cv_imports")
      .update({ status: "failed", error_message: message })
      .eq("id", id);
    if (err instanceof AiProviderError) return aiJsonError(err);
    return jsonError(message, 500);
  }
}
