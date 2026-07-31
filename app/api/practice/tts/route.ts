import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { synthesizeSpeech } from "@/lib/elevenlabs";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";

const schema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  try {
    await assertWithinLimit(user!.id, "tts");
    const audio = await synthesizeSpeech(parsed.data.text);
    await recordUsage(user!.id, "tts", 1, {
      characters: parsed.data.text.length,
    });
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof EntitlementError) return jsonError(err.message, 403);
    const message =
      err instanceof Error && err.message.includes("ELEVENLABS_API_KEY")
        ? "Text-to-speech is not configured."
        : err instanceof Error
          ? err.message
          : "TTS failed";
    return jsonError(message, 500);
  }
}
