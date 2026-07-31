import { withCareerAi } from "@/lib/ai/run";
import { improvedResponsibilitiesSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";
import type { ImproveResponsibilitiesInput } from "@/lib/ai/provider";

export async function improveResponsibilities(
  params: ImproveResponsibilitiesInput,
  userId: string,
) {
  const result = await withCareerAi(
    { userId, operation: "responsibility_improve" },
    (provider) => provider.improveResponsibilities(params),
  );
  return validateAiPayload(
    improvedResponsibilitiesSchema,
    result,
    "Improved responsibilities",
  );
}
