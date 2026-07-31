import type { PlanId } from "@/types/domain";

export const PLAN_CONFIG = {
  free: {
    maxExperiences: 2,
    maxEvidenceCards: 5,
    maxCvImportsPerMonth: 1,
    maxJobTargets: 1,
    maxGenerationsPerMonth: 5,
    maxPracticeAttemptsPerMonth: 3,
    maxVoiceRecordingSeconds: 0,
    voicePractice: false,
    jobMatching: false,
    mockInterviews: false,
  },
  prepare: {
    maxExperiences: null,
    maxEvidenceCards: 50,
    maxCvImportsPerMonth: 5,
    maxJobTargets: 10,
    maxGenerationsPerMonth: 50,
    maxPracticeAttemptsPerMonth: 30,
    maxVoiceRecordingSeconds: 120,
    voicePractice: true,
    jobMatching: true,
    mockInterviews: false,
  },
  intensive: {
    maxExperiences: null,
    maxEvidenceCards: null,
    maxCvImportsPerMonth: 20,
    maxJobTargets: null,
    maxGenerationsPerMonth: 200,
    maxPracticeAttemptsPerMonth: 100,
    maxVoiceRecordingSeconds: 300,
    voicePractice: true,
    jobMatching: true,
    mockInterviews: true,
  },
  "interview-pass": {
    maxExperiences: null,
    maxEvidenceCards: null,
    maxCvImportsPerMonth: 1,
    maxJobTargets: 1,
    maxGenerationsPerMonth: 25,
    maxPracticeAttemptsPerMonth: 25,
    maxVoiceRecordingSeconds: 300,
    voicePractice: true,
    jobMatching: true,
    mockInterviews: true,
  },
} as const;

export type PlanConfig = (typeof PLAN_CONFIG)[PlanId];

/** Beta override: raise free-tier limits for testing without Stripe. */
export function getEffectivePlan(plan: PlanId): PlanId {
  const betaPlan = process.env.BETA_PLAN_OVERRIDE as PlanId | undefined;
  if (betaPlan && betaPlan in PLAN_CONFIG) return betaPlan;
  return plan;
}
