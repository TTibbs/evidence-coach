export type AiProviderName = "gemini" | "openai";

export type ConfiguredAiProvider = "gemini" | "openai" | "mock";

export type AiProviderAvailability = {
  provider: AiProviderName;
  enabled: boolean;
  availableToUser: boolean;
  requiresPaidPlan: boolean;
  label: string;
  description: string;
};

export const AI_PROVIDER_CONFIG = {
  gemini: {
    enabled: true,
    availableToUser: true,
    requiresPaidPlan: false,
    label: "Gemini",
    description: "Included during the MVP beta",
  },
  openai: {
    enabled: false,
    availableToUser: false,
    requiresPaidPlan: true,
    label: "OpenAI",
    description: "Premium provider — not currently available",
  },
} as const satisfies Record<
  AiProviderName,
  Omit<AiProviderAvailability, "provider">
>;

export type AiUsageOperation =
  | "cv_extraction"
  | "evidence_topics"
  | "evidence_questions"
  | "evidence_card"
  | "job_analysis"
  | "career_content"
  | "responsibility_improve"
  | "practice_question"
  | "practice_feedback"
  | "voice_transcription";

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1";
}

function envInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function getConfiguredAiProvider(): ConfiguredAiProvider {
  const value = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  if (value === "openai" || value === "mock" || value === "gemini") {
    return value;
  }
  return "gemini";
}

export function isGeminiEnabled(): boolean {
  return (
    envFlag("AI_GEMINI_ENABLED", AI_PROVIDER_CONFIG.gemini.enabled) &&
    AI_PROVIDER_CONFIG.gemini.enabled
  );
}

export function isOpenAiEnabled(): boolean {
  return (
    envFlag("AI_OPENAI_ENABLED", AI_PROVIDER_CONFIG.openai.enabled) &&
    AI_PROVIDER_CONFIG.openai.enabled
  );
}

export function isOpenAiUserAccessAllowed(): boolean {
  return (
    envFlag("AI_OPENAI_USER_ACCESS", AI_PROVIDER_CONFIG.openai.availableToUser) &&
    AI_PROVIDER_CONFIG.openai.availableToUser
  );
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || undefined;
}

export function getAiDailyRequestLimit(): number {
  return envInt("AI_FREE_DAILY_REQUEST_LIMIT", 40);
}

export function getAiMonthlyRequestLimit(): number {
  return envInt("AI_FREE_MONTHLY_REQUEST_LIMIT", 400);
}

export type ProviderUserContext = {
  id: string;
  plan?: string | null;
};

/**
 * Server-side entitlement check. OpenAI always false during MVP.
 * Structure allows later paid-plan gating without rewriting call sites.
 */
export function canUseProvider(
  _user: ProviderUserContext | null | undefined,
  provider: AiProviderName,
): boolean {
  if (provider === "openai") {
    return isOpenAiEnabled() && isOpenAiUserAccessAllowed();
  }
  return isGeminiEnabled() && AI_PROVIDER_CONFIG.gemini.availableToUser;
}

export function getProviderAvailability(): AiProviderAvailability[] {
  return (Object.keys(AI_PROVIDER_CONFIG) as AiProviderName[]).map(
    (provider) => ({
      provider,
      ...AI_PROVIDER_CONFIG[provider],
      enabled:
        provider === "gemini" ? isGeminiEnabled() : isOpenAiEnabled(),
      availableToUser:
        provider === "gemini"
          ? isGeminiEnabled() && AI_PROVIDER_CONFIG.gemini.availableToUser
          : isOpenAiEnabled() && isOpenAiUserAccessAllowed(),
    }),
  );
}
