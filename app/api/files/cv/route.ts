import { requireUser, jsonError } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id");

  const { data: cvImport, error } = await supabase
    .from("cv_imports")
    .select("id, file_path, original_filename")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !cvImport) return jsonError("CV import not found", 404);

  const { data: signed, error: signError } = await supabase.storage
    .from("cvs")
    .createSignedUrl(cvImport.file_path, 60 * 60);

  if (signError || !signed?.signedUrl) {
    return jsonError(signError?.message || "Could not create download link", 500);
  }

  return NextResponse.json({
    url: signed.signedUrl,
    filename: cvImport.original_filename ?? "cv",
  });
}

export async function DELETE(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Missing id");

  const { data: cvImport, error } = await supabase
    .from("cv_imports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !cvImport) return jsonError("CV import not found", 404);

  await supabase.storage.from("cvs").remove([cvImport.file_path]);
  await supabase.from("cv_imports").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
