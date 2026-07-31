import type { AiUsageOperation } from "@/lib/ai/config";
import {
  getAiDailyRequestLimit,
  getAiMonthlyRequestLimit,
} from "@/lib/ai/config";
import { AiProviderError } from "@/lib/ai/errors";
import { createClient } from "@/lib/supabase/server";

export type AiUsageRecord = {
  userId: string;
  provider: string;
  model: string;
  operation: AiUsageOperation;
  success: boolean;
  latencyMs: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  errorCategory?: string | null;
};

function startOfDayIso() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

export async function assertAiRequestAllowed(userId: string) {
  const supabase = await createClient();
  const dailyLimit = getAiDailyRequestLimit();
  const monthlyLimit = getAiMonthlyRequestLimit();

  const [{ count: dailyCount }, { count: monthlyCount }] = await Promise.all([
    supabase
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("success", true)
      .gte("created_at", startOfDayIso()),
    supabase
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("success", true)
      .gte("created_at", startOfMonthIso()),
  ]);

  if ((dailyCount ?? 0) >= dailyLimit) {
    throw new AiProviderError({
      category: "quota",
      userMessage:
        "The free AI usage limit has been reached. Please try again later.",
      message: `Daily AI limit reached (${dailyLimit})`,
    });
  }

  if ((monthlyCount ?? 0) >= monthlyLimit) {
    throw new AiProviderError({
      category: "quota",
      userMessage:
        "The free AI usage limit has been reached. Please try again later.",
      message: `Monthly AI limit reached (${monthlyLimit})`,
    });
  }
}

export async function recordAiUsage(record: AiUsageRecord) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_usage_events").insert({
      user_id: record.userId,
      provider: record.provider,
      model: record.model,
      operation: record.operation,
      success: record.success,
      latency_ms: record.latencyMs,
      input_tokens: record.inputTokens ?? null,
      output_tokens: record.outputTokens ?? null,
      error_category: record.errorCategory ?? null,
    });
    if (error) {
      console.error("Failed to record ai_usage_events", {
        code: error.code,
        message: error.message,
        operation: record.operation,
        provider: record.provider,
      });
    }
  } catch (err) {
    console.error("Failed to record ai_usage_events", {
      operation: record.operation,
      provider: record.provider,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** In-memory recorder for unit tests (no Supabase). */
export function createMemoryAiUsageStore() {
  const events: AiUsageRecord[] = [];
  return {
    events,
    async record(record: AiUsageRecord) {
      events.push(record);
    },
  };
}
