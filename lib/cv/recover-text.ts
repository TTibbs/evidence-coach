import type { SupabaseClient } from "@supabase/supabase-js";
import { extractTextFromFile } from "@/lib/cv/parse";

type CvImportRow = {
  id: string;
  file_path: string;
  original_filename?: string | null;
  extracted_text?: string | null;
};

/**
 * Return stored CV text, or parse it from the original file and persist it.
 */
export async function ensureCvExtractedText(
  supabase: SupabaseClient,
  cvImport: CvImportRow,
): Promise<{ text: string; recovered: boolean }> {
  const existing = (cvImport.extracted_text ?? "").trim();
  if (existing) {
    return { text: existing, recovered: false };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("cvs")
    .download(cvImport.file_path);

  if (downloadError || !fileData) {
    throw new Error(
      "No CV text stored and the original file could not be read.",
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const filename = cvImport.original_filename || cvImport.file_path;
  const text = (await extractTextFromFile(buffer, filename)).trim();
  if (!text) {
    throw new Error("Could not extract text from the original CV file.");
  }

  const { error: updateError } = await supabase
    .from("cv_imports")
    .update({ extracted_text: text })
    .eq("id", cvImport.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { text, recovered: true };
}
