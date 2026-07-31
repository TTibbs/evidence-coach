import { withCareerAi } from "@/lib/ai/run";
import { cardsWithConfirmedMetricsOnly } from "@/lib/ai/confirmed-metrics";
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
  return withCareerAi(
    { userId, operation: "career_content" },
    (provider) =>
      provider.generateCareerContent({
        ...params,
        cards,
      }),
  );
}
