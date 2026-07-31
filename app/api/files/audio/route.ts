import { requireUser, jsonError } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const attemptId = searchParams.get("attemptId");
  if (!attemptId) return jsonError("Missing attemptId");

  const { data: attempt, error } = await supabase
    .from("practice_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user!.id)
    .single();

  if (error || !attempt) return jsonError("Attempt not found", 404);
  if (!attempt.audio_path) return jsonError("No audio on this attempt");

  await supabase.storage.from("practice-audio").remove([attempt.audio_path]);
  await supabase
    .from("practice_attempts")
    .update({ audio_path: null })
    .eq("id", attemptId);

  return NextResponse.json({ ok: true });
}
