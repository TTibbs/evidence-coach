import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { analysePracticeAnswer } from "@/lib/ai/feedback";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

const schema = z.object({
  sessionId: z.string().uuid(),
  answerText: z.string().min(1),
  audioPath: z.string().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
});

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .select("*, evidence_cards(*)")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user!.id)
    .single();

  if (sessionError || !session) return jsonError("Session not found", 404);

  const action =
    session.mode === "voice" ? "voice_transcription" : "practice_feedback";

  let planConfig;
  try {
    planConfig = await assertWithinLimit(user!.id, action);
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }
  if (
    session.mode === "voice" &&
    parsed.data.durationSeconds &&
    parsed.data.durationSeconds > planConfig.maxVoiceRecordingSeconds
  ) {
    return jsonError(
      `Voice recordings on your plan must be ${planConfig.maxVoiceRecordingSeconds} seconds or shorter`,
      403,
    );
  }

  let analysis;
  try {
    analysis = await analysePracticeAnswer(
      {
        question: session.question,
        answerText: parsed.data.answerText,
        evidenceCard: session.evidence_cards,
        mode: session.mode,
      },
      user!.id,
    );
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }

  const { count } = await supabase
    .from("practice_attempts")
    .select("id", { count: "exact", head: true })
    .eq("practice_session_id", session.id);

  const attemptNumber = (count ?? 0) + 1;

  const { data: attempt, error } = await supabase
    .from("practice_attempts")
    .insert({
      practice_session_id: session.id,
      user_id: user!.id,
      answer_text: parsed.data.answerText,
      audio_path: parsed.data.audioPath || null,
      duration_seconds: parsed.data.durationSeconds || null,
      scores: analysis.scores,
      feedback: {
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        tryAgain: analysis.tryAgain,
        evidenceComparison: analysis.evidenceComparison,
        summary: analysis.summary,
      },
      structure_breakdown: analysis.structureBreakdown,
      attempt_number: attemptNumber,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await recordUsage(
    user!.id,
    session.mode === "voice" ? "voice_transcription" : "practice_feedback",
    1,
    {
      sessionId: session.id,
      attemptId: attempt.id,
      durationSeconds: parsed.data.durationSeconds ?? null,
    },
  );

  return NextResponse.json({ attempt }, { status: 201 });
}
