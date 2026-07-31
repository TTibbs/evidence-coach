import { withCareerAi } from "@/lib/ai/run";
import { cardsWithConfirmedMetricsOnly } from "@/lib/ai/confirmed-metrics";
import { generatedContentSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";
import type { GeneratedContentType } from "@/types/domain";

export async function generateFromEvidence(
  params: {
    type: GeneratedContentType;
    cards: unknown[];
    jobTarget?: unknown;
    question?: string;
  },
  userId: string,
) {
  const cards = cardsWithConfirmedMetricsOnly(params.cards);
  const result = await withCareerAi(
    { userId, operation: "career_content" },
    (provider) =>
      provider.generateCareerContent({
        ...params,
        cards,
      }),
  );
  return validateAiPayload(generatedContentSchema, result, "Generated content");
}
