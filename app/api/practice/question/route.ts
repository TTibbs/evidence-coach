import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { generatePracticeQuestion } from "@/lib/ai/practice-question";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

const schema = z.object({
  evidenceCardId: z.string().uuid(),
  competency: z.string().optional().nullable(),
  jobTargetId: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const { data: evidenceCard, error: cardError } = await supabase
    .from("evidence_cards")
    .select("*")
    .eq("id", parsed.data.evidenceCardId)
    .eq("user_id", user!.id)
    .eq("confidence_status", "confirmed")
    .single();

  if (cardError || !evidenceCard) {
    return jsonError("Select a confirmed evidence card", 404);
  }

  let jobTarget = null;
  if (parsed.data.jobTargetId) {
    const { data } = await supabase
      .from("job_targets")
      .select("*")
      .eq("id", parsed.data.jobTargetId)
      .eq("user_id", user!.id)
      .single();
    jobTarget = data;
  }

  try {
    const question = await generatePracticeQuestion(
      {
        evidenceCard,
        competency: parsed.data.competency ?? undefined,
        jobTarget,
      },
      user!.id,
    );

    return NextResponse.json(question);
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }
}
