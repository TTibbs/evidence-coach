import { withCareerAi } from "@/lib/ai/run";
import type { ImproveResponsibilitiesInput } from "@/lib/ai/provider";

export async function improveResponsibilities(
  params: ImproveResponsibilitiesInput,
  userId: string,
) {
  return withCareerAi(
    { userId, operation: "responsibility_improve" },
    (provider) => provider.improveResponsibilities(params),
  );
}
