import { withCareerAi } from "@/lib/ai/run";
import { jdAnalysisSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";

export async function analyseJobDescription(
  params: {
    title: string;
    description: string;
    confirmedCards: unknown[];
  },
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "job_analysis" },
    (provider) => provider.analyseJobDescription(params),
  );
  return validateAiPayload(jdAnalysisSchema, result, "Job description analysis");
}
