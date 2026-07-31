import {
  canUseProvider,
  getConfiguredAiProvider,
  isOpenAiEnabled,
  type AiProviderName,
  type ProviderUserContext,
} from "@/lib/ai/config";
import { ProviderUnavailableError } from "@/lib/ai/errors";
import type { CareerAiProvider } from "@/lib/ai/provider";
import { GeminiCareerAiProvider } from "@/lib/ai/providers/gemini";
import { MockCareerAiProvider } from "@/lib/ai/providers/mock";
import { OpenAiCareerAiProvider } from "@/lib/ai/providers/openai";

/**
 * Resolve the Career AI provider for server-side use.
 *
 * - Ignores any client-supplied provider name (do not pass request body values).
 * - Free MVP users always get Gemini (or mock when AI_PROVIDER=mock).
 * - OpenAI is never returned while disabled / unavailable to users.
 * - Never falls back from Gemini to OpenAI on errors.
 */
export function getCareerAiProvider(
  user?: ProviderUserContext | null,
  /** Ignored for security — present only to catch mistaken client passthrough. */
  _clientRequestedProvider?: string | null,
): CareerAiProvider {
  void _clientRequestedProvider;

  const configured = getConfiguredAiProvider();

  if (configured === "mock") {
    return new MockCareerAiProvider();
  }

  // Explicit openai config still requires server-side entitlement.
  if (configured === "openai") {
    if (!canUseProvider(user ?? null, "openai") || !isOpenAiEnabled()) {
      throw new ProviderUnavailableError(
        "openai",
        "OpenAI is configured but not available to users",
      );
    }
    return new OpenAiCareerAiProvider();
  }

  // Default MVP path: Gemini
  if (!canUseProvider(user ?? null, "gemini")) {
    throw new ProviderUnavailableError(
      "gemini",
      "Gemini is not enabled",
    );
  }

  return new GeminiCareerAiProvider();
}

/** Test helper — force a specific provider without env. */
export function createProviderForTests(
  name: AiProviderName | "mock",
): CareerAiProvider {
  if (name === "mock") return new MockCareerAiProvider();
  if (name === "openai") return new OpenAiCareerAiProvider();
  return new GeminiCareerAiProvider();
}
