import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { synthesizeSpeech } from "@/lib/elevenlabs";

const schema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const { response } = await requireUser();
  if (response) return response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  try {
    const audio = await synthesizeSpeech(parsed.data.text);
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return jsonError(message, 500);
  }
}
