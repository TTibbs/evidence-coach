import { withCareerAi } from "@/lib/ai/run";
import { practiceFeedbackSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";

export async function analysePracticeAnswer(
  params: {
    question: string;
    answerText: string;
    evidenceCard: unknown;
    mode: "text" | "voice";
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "practice_feedback" },
    (provider) => provider.analysePracticeAnswer(params),
  );
  return validateAiPayload(practiceFeedbackSchema, result, "Practice feedback");
}
