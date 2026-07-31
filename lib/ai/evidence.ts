import { withCareerAi } from "@/lib/ai/run";
import {
  evidenceCardDraftSchema,
  interviewQuestionsSchema,
  nextQuestionSchema,
} from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";
import type { ExperienceInput } from "@/lib/ai/provider";

export type { ExperienceInput };

export async function suggestEvidenceQuestions(
  experience: ExperienceInput,
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "evidence_questions" },
    (provider) => provider.suggestEvidenceQuestions({ experience }),
  );
  return validateAiPayload(
    interviewQuestionsSchema,
    result,
    "Evidence questions",
  );
}

export async function decideNextQuestion(
  params: {
    experience: ExperienceInput;
    topic: string;
    asked: string[];
    answers: string[];
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "evidence_questions" },
    (provider) => provider.decideNextQuestion(params),
  );
  return validateAiPayload(nextQuestionSchema, result, "Next evidence question");
}

export async function draftEvidenceCard(
  params: {
    experience: ExperienceInput;
    topic: string;
    qa: { question: string; answer: string }[];
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "evidence_card" },
    (provider) => provider.createEvidenceCard(params),
  );
  return validateAiPayload(evidenceCardDraftSchema, result, "Evidence card");
}
