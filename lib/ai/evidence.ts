import { withCareerAi } from "@/lib/ai/run";
import type { ExperienceInput } from "@/lib/ai/provider";

export type { ExperienceInput };

export async function suggestEvidenceQuestions(
  experience: ExperienceInput,
  userId: string,
) {
  return withCareerAi(
    { userId, operation: "evidence_questions" },
    (provider) => provider.suggestEvidenceQuestions({ experience }),
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
  return withCareerAi(
    { userId, operation: "evidence_questions" },
    (provider) => provider.decideNextQuestion(params),
  );
}

export async function draftEvidenceCard(
  params: {
    experience: ExperienceInput;
    topic: string;
    qa: { question: string; answer: string }[];
  },
  userId: string,
) {
  return withCareerAi(
    { userId, operation: "evidence_card" },
    (provider) => provider.createEvidenceCard(params),
  );
}
