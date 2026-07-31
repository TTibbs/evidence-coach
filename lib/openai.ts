import OpenAI from "openai";
import { getOpenAiApiKey, getOpenAiModel } from "@/lib/ai/config";
import { ProviderUnavailableError } from "@/lib/ai/errors";

let client: OpenAI | null = null;

/**
 * Lazy OpenAI client. Safe to import without OPENAI_API_KEY when OpenAI is disabled.
 * Only constructs when the OpenAI provider is actually invoked.
 */
export function getOpenAI() {
  if (!client) {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      throw new ProviderUnavailableError(
        "openai",
        "OPENAI_API_KEY is not set",
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/** Reset singleton — used in tests. */
export function resetOpenAIClient() {
  client = null;
}

export const OPENAI_MODEL = getOpenAiModel();
