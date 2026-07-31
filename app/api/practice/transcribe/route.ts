import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { AiProviderError } from "@/lib/ai/errors";
import { withCareerAi } from "@/lib/ai/run";
import { NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 25_000_000;
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  try {
    await assertWithinLimit(user!.id, "voice_transcription");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const form = await request.formData();
  const file = form.get("audio");
  const sessionId = form.get("sessionId");
  if (!(file instanceof File)) return jsonError("Missing audio");
  if (typeof sessionId !== "string") return jsonError("Missing sessionId");
  if (file.size > MAX_AUDIO_BYTES) {
    return jsonError("Audio recording must be 25 MB or smaller");
  }
  const mimeType = file.type || "audio/webm";
  if (!SUPPORTED_AUDIO_TYPES.has(mimeType)) {
    return jsonError("Unsupported audio format");
  }

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user!.id)
    .single();

  if (!session) return jsonError("Session not found", 404);

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${user!.id}/${sessionId}/${crypto.randomUUID()}.webm`;

  const { error: uploadError } = await supabase.storage
    .from("practice-audio")
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) return jsonError(uploadError.message, 500);

  try {
    const result = await withCareerAi(
      { userId: user!.id, operation: "voice_transcription" },
      (provider) =>
        provider.transcribeAudio({
          audio: buffer,
          mimeType,
          filename: "answer.webm",
        }),
    );

    return NextResponse.json({
      transcript: result.transcript,
      audioPath: path,
    });
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }
}
