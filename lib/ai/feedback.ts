import { withCareerAi } from "@/lib/ai/run";

export async function analysePracticeAnswer(
  params: {
    question: string;
    answerText: string;
    evidenceCard: unknown;
    mode: "text" | "voice";
  },
  userId: string,
) {
  return withCareerAi(
    { userId, operation: "practice_feedback" },
    (provider) => provider.analysePracticeAnswer(params),
  );
}
