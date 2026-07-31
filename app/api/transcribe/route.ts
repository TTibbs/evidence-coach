import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { AiProviderError } from "@/lib/ai/errors";
import { withCareerAi } from "@/lib/ai/run";
import { transcriptionSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";
import { validateAudioUpload } from "@/lib/audio-upload";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  let planConfig;
  try {
    planConfig = await assertWithinLimit(user!.id, "voice_transcription");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const form = await request.formData();
  const file = form.get("audio");
  const durationSecondsValue = form.get("durationSeconds");
  if (!(file instanceof File)) return jsonError("Missing audio");

  const validation = validateAudioUpload(
    file,
    durationSecondsValue,
    planConfig.maxVoiceRecordingSeconds,
  );
  if (!validation.ok) {
    return jsonError(validation.message, validation.status);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await withCareerAi(
      { userId: user!.id, operation: "voice_transcription" },
      (provider) =>
        provider.transcribeAudio({
          audio: buffer,
          mimeType: validation.mimeType,
          filename: "dictation.webm",
        }),
    );

    const transcription = validateAiPayload(
      transcriptionSchema,
      result,
      "Voice transcription",
    );
    await recordUsage(user!.id, "voice_transcription", 1, {
      source: "dictation",
    });

    return NextResponse.json({
      transcript: transcription.transcript,
      durationSeconds: validation.durationSeconds,
    });
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }
}
