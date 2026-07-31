import { withCareerAi } from "@/lib/ai/run";
import { cvExtractionSchema } from "@/lib/ai/schemas";
import { validateAiPayload } from "@/lib/ai/validated";
import { normalizeExtractedResponsibilities } from "@/lib/cv/responsibilities";
import {
  annotateCvSections,
  filterExperiencesDroppingSectionHeadings,
} from "@/lib/cv/sections";

export async function extractCvFromText(cvText: string, userId: string) {
  const annotated = annotateCvSections(cvText);
  const result = await withCareerAi(
    { userId, operation: "cv_extraction" },
    (provider) => provider.extractCv({ cvText: annotated }),
  );

  const parsed = validateAiPayload(cvExtractionSchema, result, "CV extraction");

  const experiences = normalizeExtractedResponsibilities(
    filterExperiencesDroppingSectionHeadings(parsed.experiences),
  );

  return {
    ...parsed,
    experiences,
  };
}
