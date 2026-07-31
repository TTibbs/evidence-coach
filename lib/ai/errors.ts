export type AiErrorCategory =
  | "missing_config"
  | "quota"
  | "rate_limit"
  | "timeout"
  | "invalid_output"
  | "blocked"
  | "unavailable_model"
  | "unsupported_region"
  | "outage"
  | "not_implemented"
  | "provider_disabled"
  | "unknown";

export class AiProviderError extends Error {
  readonly category: AiErrorCategory;
  readonly userMessage: string;
  readonly provider?: string;

  constructor(options: {
    category: AiErrorCategory;
    userMessage: string;
    message?: string;
    provider?: string;
    cause?: unknown;
  }) {
    super(options.message ?? options.userMessage, { cause: options.cause });
    this.name = "AiProviderError";
    this.category = options.category;
    this.userMessage = options.userMessage;
    this.provider = options.provider;
  }
}

export class ProviderNotImplementedError extends AiProviderError {
  constructor(provider: string, method: string) {
    super({
      category: "not_implemented",
      provider,
      userMessage: "AI assistance is temporarily unavailable.",
      message: `${provider} does not implement ${method}`,
    });
    this.name = "ProviderNotImplementedError";
  }
}

export class ProviderUnavailableError extends AiProviderError {
  constructor(provider: string, reason?: string) {
    super({
      category: "provider_disabled",
      provider,
      userMessage:
        provider === "openai"
          ? "OpenAI is a premium provider and is not available during the MVP."
          : "AI assistance is temporarily unavailable.",
      message: reason ?? `${provider} is not available`,
    });
    this.name = "ProviderUnavailableError";
  }
}

const FREE_TIER_UNAVAILABLE =
  "The free AI service is temporarily unavailable or has reached its usage limit. Please try again later.";

export function mapProviderFailure(
  err: unknown,
  provider: string,
): AiProviderError {
  if (err instanceof AiProviderError) return err;

  const raw =
    err instanceof Error
      ? `${err.message} ${String((err as Error & { code?: string }).code ?? "")}`
      : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes("api key") ||
    lower.includes("api_key") ||
    lower.includes("missing") && lower.includes("gemini")
  ) {
    return new AiProviderError({
      category: "missing_config",
      provider,
      userMessage: "AI assistance is temporarily unavailable.",
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("exceeded")
  ) {
    return new AiProviderError({
      category: "quota",
      provider,
      userMessage: FREE_TIER_UNAVAILABLE,
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests")
  ) {
    return new AiProviderError({
      category: "rate_limit",
      provider,
      userMessage: FREE_TIER_UNAVAILABLE,
      message: raw,
      cause: err,
    });
  }

  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline")) {
    return new AiProviderError({
      category: "timeout",
      provider,
      userMessage: "AI assistance is temporarily unavailable.",
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("safety") ||
    lower.includes("blocked") ||
    lower.includes("prohibited")
  ) {
    return new AiProviderError({
      category: "blocked",
      provider,
      userMessage: "This request could not be processed safely.",
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("not found") ||
    lower.includes("model") && lower.includes("unavailable")
  ) {
    return new AiProviderError({
      category: "unavailable_model",
      provider,
      userMessage: "AI assistance is temporarily unavailable.",
      message: raw,
      cause: err,
    });
  }

  if (lower.includes("region") || lower.includes("location") || lower.includes("country")) {
    return new AiProviderError({
      category: "unsupported_region",
      provider,
      userMessage: "AI assistance is temporarily unavailable.",
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("schema") ||
    lower.includes("invalid json") ||
    lower.includes("failed schema") ||
    lower.includes("parse")
  ) {
    return new AiProviderError({
      category: "invalid_output",
      provider,
      userMessage: "We could not validate the generated result. Please try again.",
      message: raw,
      cause: err,
    });
  }

  if (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("unavailable") ||
    lower.includes("internal error")
  ) {
    return new AiProviderError({
      category: "outage",
      provider,
      userMessage: FREE_TIER_UNAVAILABLE,
      message: raw,
      cause: err,
    });
  }

  return new AiProviderError({
    category: "unknown",
    provider,
    userMessage: "AI assistance is temporarily unavailable.",
    message: raw,
    cause: err,
  });
}

export function toUserFacingAiError(err: unknown): string {
  if (err instanceof AiProviderError) return err.userMessage;
  return "AI assistance is temporarily unavailable.";
}
