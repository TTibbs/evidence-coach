import { withCareerAi } from "@/lib/ai/run";
import { practiceQuestionSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";

export async function generatePracticeQuestion(
  params: {
    evidenceCard: unknown;
    competency?: string;
    jobTarget?: unknown;
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "practice_question" },
    (provider) => provider.generatePracticeQuestion(params),
  );
  return validateAiPayload(practiceQuestionSchema, result, "Practice question");
}
