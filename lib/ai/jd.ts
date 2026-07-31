import { withCareerAi } from "@/lib/ai/run";

export async function analyseJobDescription(
  params: {
    title: string;
    description: string;
    confirmedCards: unknown[];
  },
  userId: string,
) {
  return withCareerAi(
    { userId, operation: "job_analysis" },
    (provider) => provider.analyseJobDescription(params),
  );
}
