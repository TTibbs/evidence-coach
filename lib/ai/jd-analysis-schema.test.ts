import { describe, expect, it } from "vitest";
import { jdAnalysisSchema } from "@/lib/ai/schemas";

describe("jdAnalysisSchema", () => {
  it("accepts the canonical job analysis shape", () => {
    const parsed = jdAnalysisSchema.parse({
      extractedSkills: ["Stakeholder management"],
      extractedCompetencies: ["Leadership"],
      matchSummary: {
        strong: ["Leadership"],
        partial: [],
        gaps: ["Budget ownership"],
      },
    });

    expect(parsed.extractedSkills).toEqual(["Stakeholder management"]);
    expect(parsed.matchSummary.gaps).toEqual(["Budget ownership"]);
  });

  it("normalizes common Gemini alias keys", () => {
    const parsed = jdAnalysisSchema.parse({
      skills: ["CRM"],
      competencies: ["Communication"],
      strong: ["Communication"],
      partial: ["CRM"],
      gaps: ["Forecasting"],
    });

    expect(parsed).toEqual({
      extractedSkills: ["CRM"],
      extractedCompetencies: ["Communication"],
      matchSummary: {
        strong: ["Communication"],
        partial: ["CRM"],
        gaps: ["Forecasting"],
      },
    });
  });

  it("normalizes snake_case job analysis keys", () => {
    const parsed = jdAnalysisSchema.parse({
      extracted_skills: ["SQL"],
      extracted_competencies: ["Problem solving"],
      match_summary: {
        strong: [],
        partial: ["SQL"],
        gaps: ["Stakeholder updates"],
      },
    });

    expect(parsed.extractedSkills).toEqual(["SQL"]);
    expect(parsed.extractedCompetencies).toEqual(["Problem solving"]);
    expect(parsed.matchSummary.partial).toEqual(["SQL"]);
  });
});
