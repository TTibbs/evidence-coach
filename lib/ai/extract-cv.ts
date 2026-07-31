import { withCareerAi } from "@/lib/ai/run";
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

  const experiences = normalizeExtractedResponsibilities(
    filterExperiencesDroppingSectionHeadings(result.experiences),
  );

  return {
    ...result,
    experiences,
  };
}
