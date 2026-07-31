import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { extractTextFromFile } from "@/lib/cv/parse";
import { extractCvFromText } from "@/lib/ai/extract-cv";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  try {
    await assertWithinLimit(user!.id, "cv_import");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Missing file");

  const filename = file.name;
  if (!/\.(pdf|docx)$/i.test(filename)) {
    return jsonError("Only PDF and DOCX files are supported");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${user!.id}/${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return jsonError(uploadError.message, 500);

  const { data: cvImport, error: insertError } = await supabase
    .from("cv_imports")
    .insert({
      user_id: user!.id,
      file_path: path,
      original_filename: filename,
      status: "processing",
    })
    .select()
    .single();

  if (insertError) return jsonError(insertError.message, 500);

  try {
    const text = await extractTextFromFile(buffer, filename);
    if (!text.trim()) throw new Error("Could not extract text from CV");

    // Persist text immediately so experience pages can show it even if AI fails.
    await supabase
      .from("cv_imports")
      .update({ extracted_text: text })
      .eq("id", cvImport.id);

    const draft = await extractCvFromText(text, user!.id);

    const { data: updated, error: updateError } = await supabase
      .from("cv_imports")
      .update({
        status: "ready_for_review",
        extracted_draft: draft,
        extracted_text: text,
      })
      .eq("id", cvImport.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    await recordUsage(user!.id, "cv_import", 1, { cvImportId: cvImport.id });
    return NextResponse.json({ cvImport: updated }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof AiProviderError
        ? err.userMessage
        : err instanceof Error
          ? err.message
          : "CV processing failed";
    console.error("CV processing failed", {
      cvImportId: cvImport.id,
      filename,
      message,
      cause: err instanceof Error ? err.cause : undefined,
    });
    await supabase
      .from("cv_imports")
      .update({ status: "failed", error_message: message })
      .eq("id", cvImport.id);
    if (err instanceof AiProviderError) return aiJsonError(err);
    return jsonError(message, 500);
  }
}
