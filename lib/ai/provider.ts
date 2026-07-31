import type { z } from "zod";
import type { GeneratedContentType } from "@/types/domain";
import type {
  cvExtractionSchema,
  evidenceCardDraftSchema,
  generatedContentSchema,
  interviewQuestionsSchema,
  jdAnalysisSchema,
  nextQuestionSchema,
  practiceFeedbackSchema,
} from "@/lib/ai/schemas";

export type ExperienceInput = {
  title: string;
  organisation?: string | null;
  description?: string | null;
  responsibilities: string[];
};

export type ExtractCvInput = { cvText: string };
export type SuggestEvidenceQuestionsInput = { experience: ExperienceInput };
export type DecideNextQuestionInput = {
  experience: ExperienceInput;
  topic: string;
  asked: string[];
  answers: string[];
};
export type CreateEvidenceCardInput = {
  experience: ExperienceInput;
  topic: string;
  qa: { question: string; answer: string }[];
};
export type AnalyseJobDescriptionInput = {
  title: string;
  description: string;
  confirmedCards: unknown[];
};
export type GenerateCareerContentInput = {
  type: GeneratedContentType;
  cards: unknown[];
  jobTarget?: unknown;
  question?: string;
};
export type ImproveResponsibilitiesInput = {
  title: string;
  organisation?: string | null;
  type?: string;
  style: "polish" | "professional" | "confident" | "concise" | "action";
  responsibilities: string[];
};
export type AnalysePracticeAnswerInput = {
  question: string;
  answerText: string;
  evidenceCard: unknown;
  mode: "text" | "voice";
};
export type GeneratePracticeQuestionInput = {
  evidenceCard: unknown;
  competency?: string;
  jobTarget?: unknown;
};
export type TranscribeAudioInput = {
  audio: Buffer;
  mimeType: string;
  filename?: string;
};

export type ExtractedCv = z.infer<typeof cvExtractionSchema>;
export type EvidenceQuestionResult = z.infer<typeof interviewQuestionsSchema>;
export type NextQuestionResult = z.infer<typeof nextQuestionSchema>;
export type EvidenceCardDraft = z.infer<typeof evidenceCardDraftSchema>;
export type JobDescriptionAnalysis = z.infer<typeof jdAnalysisSchema>;
export type GeneratedCareerContent = z.infer<typeof generatedContentSchema>;
export type ImprovedResponsibilities = {
  responsibilities: string[];
};
export type PracticeFeedbackResult = z.infer<typeof practiceFeedbackSchema>;
export type PracticeQuestion = { question: string };
export type TranscriptionResult = { transcript: string };

export interface CareerAiProvider {
  readonly name: "gemini" | "openai" | "mock";
  readonly model: string;

  extractCv(input: ExtractCvInput): Promise<ExtractedCv>;

  suggestEvidenceQuestions(
    input: SuggestEvidenceQuestionsInput,
  ): Promise<EvidenceQuestionResult>;

  decideNextQuestion(input: DecideNextQuestionInput): Promise<NextQuestionResult>;

  createEvidenceCard(input: CreateEvidenceCardInput): Promise<EvidenceCardDraft>;

  analyseJobDescription(
    input: AnalyseJobDescriptionInput,
  ): Promise<JobDescriptionAnalysis>;

  generateCareerContent(
    input: GenerateCareerContentInput,
  ): Promise<GeneratedCareerContent>;

  improveResponsibilities(
    input: ImproveResponsibilitiesInput,
  ): Promise<ImprovedResponsibilities>;

  generatePracticeQuestion(
    input: GeneratePracticeQuestionInput,
  ): Promise<PracticeQuestion>;

  analysePracticeAnswer(
    input: AnalysePracticeAnswerInput,
  ): Promise<PracticeFeedbackResult>;

  transcribeAudio(input: TranscribeAudioInput): Promise<TranscriptionResult>;
}
