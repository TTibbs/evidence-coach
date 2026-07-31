export type ExperienceType =
  | "employment"
  | "project"
  | "freelance"
  | "volunteering"
  | "education"
  | "certificate"
  | "other";

export type PlanId = "free" | "prepare" | "intensive" | "interview-pass";

export type ConfidenceStatus = "draft" | "confirmed";

export type GeneratedContentType =
  | "cv-bullet"
  | "role-summary"
  | "profile"
  | "cover-letter-paragraph"
  | "star-answer"
  | "twenty-sixty-twenty"
  | "application-answer"
  | "tell-me-about-yourself";

export type UsageEventType =
  | "cv_import"
  | "content_generation"
  | "job_analysis"
  | "text_practice"
  | "voice_transcription"
  | "tts"
  | "practice_feedback"
  | "mock_interview";

export type EvidenceMetric = {
  label: string;
  value: string;
  confirmed: boolean;
};

export type PracticeScores = {
  relevance: number;
  ownership: number;
  specificity: number;
  structure: number;
  evidence: number;
  outcome: number;
  conciseness: number;
  delivery?: number;
};

export type PracticeFeedback = {
  strengths: string[];
  improvements: string[];
  tryAgain: string[];
  evidenceComparison: {
    used: string[];
    missed: string[];
  };
  summary: string;
};

export type ExtractedExperienceDraft = {
  type: ExperienceType;
  organisation?: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  responsibilities: string[];
};

export type CvExtractionDraft = {
  name?: string;
  experiences: ExtractedExperienceDraft[];
  skills: string[];
};

export const STARTER_COMPETENCIES = [
  "communication",
  "teamwork",
  "problem-solving",
  "leadership",
  "ownership",
  "adaptability",
  "customer-service",
  "time-management",
  "conflict-resolution",
  "working-under-pressure",
] as const;
