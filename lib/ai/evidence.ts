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
  focus?: string,
) {
  const result = await withCareerAi(
    { userId, operation: "evidence_questions" },
    (provider) => provider.suggestEvidenceQuestions({ experience, focus }),
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

export async function enrichEvidenceCard(
  params: {
    experience: ExperienceInput;
    existingCard: unknown;
    additionalDetails: string;
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "evidence_card" },
    (provider) => provider.enrichEvidenceCard(params),
  );
  const draft = validateAiPayload(
    evidenceCardDraftSchema,
    result,
    "Enriched evidence card",
  );
  const sourceFacts = [...draft.sourceFacts];
  if (!sourceFacts.some((fact) => fact.includes(params.additionalDetails))) {
    sourceFacts.push(params.additionalDetails);
  }

  return {
    ...draft,
    metrics: draft.metrics.map((metric) => ({ ...metric, confirmed: false })),
    sourceFacts,
  };
}
