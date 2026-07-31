import type { AiUsageOperation } from "@/lib/ai/config";
import { AiProviderError, mapProviderFailure, toUserFacingAiError } from "@/lib/ai/errors";
import { getCareerAiProvider } from "@/lib/ai/get-provider";
import type { CareerAiProvider } from "@/lib/ai/provider";
import { assertAiRequestAllowed, recordAiUsage } from "@/lib/ai/usage";

export type AiRunContext = {
  userId: string;
  operation: AiUsageOperation;
  /** Never trust client provider names — factory ignores them. */
  clientRequestedProvider?: string | null;
};

export async function withCareerAi<T>(
  ctx: AiRunContext,
  fn: (provider: CareerAiProvider) => Promise<T>,
): Promise<T> {
  await assertAiRequestAllowed(ctx.userId);
  const provider = getCareerAiProvider(
    { id: ctx.userId },
    ctx.clientRequestedProvider,
  );
  const started = Date.now();

  try {
    const result = await fn(provider);
    await recordAiUsage({
      userId: ctx.userId,
      provider: provider.name,
      model: provider.model,
      operation: ctx.operation,
      success: true,
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (err) {
    const mapped =
      err instanceof AiProviderError
        ? err
        : mapProviderFailure(err, provider.name);
    await recordAiUsage({
      userId: ctx.userId,
      provider: provider.name,
      model: provider.model,
      operation: ctx.operation,
      success: false,
      latencyMs: Date.now() - started,
      errorCategory: mapped.category,
    });
    console.error("AI operation failed", {
      operation: ctx.operation,
      provider: provider.name,
      category: mapped.category,
      latencyMs: Date.now() - started,
      message: mapped.message,
    });
    throw mapped;
  }
}

export { toUserFacingAiError };
