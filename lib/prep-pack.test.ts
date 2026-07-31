import { describe, expect, it } from "vitest";
import { buildInterviewPrepPack } from "@/lib/prep-pack";

describe("buildInterviewPrepPack", () => {
  it("deduplicates requirements and maps confirmed evidence", () => {
    const pack = buildInterviewPrepPack(
      {
        id: "target-1",
        title: "Customer Success Manager",
        company: "Acme",
        extracted_competencies: ["Communication", "communication"],
        extracted_skills: ["CRM"],
        match_summary: {
          strong: ["Communication"],
          partial: ["CRM"],
          gaps: [],
        },
      },
      [
        {
          id: "card-1",
          title: "Customer escalation",
          summary: "Used clear communication to calm an unhappy customer.",
          competencies: ["communication"],
          skills: [],
          confidence_status: "confirmed",
        },
        {
          id: "card-2",
          title: "Draft card",
          summary: "CRM migration",
          skills: ["CRM"],
          confidence_status: "draft",
        },
      ],
    );

    expect(pack.targetLabel).toBe("Customer Success Manager at Acme");
    expect(pack.requirements.map((requirement) => requirement.label)).toEqual([
      "Communication",
      "CRM",
    ]);
    expect(pack.requirements[0]).toMatchObject({
      coverage: "strong",
      evidence: [expect.objectContaining({ id: "card-1" })],
    });
    expect(pack.requirements[1]).toMatchObject({
      coverage: "gap",
      evidence: [],
    });
  });

  it("turns job target gaps into evidence prompts and likely questions", () => {
    const pack = buildInterviewPrepPack(
      {
        id: "target-1",
        title: "Operations Lead",
        extracted_competencies: ["Leadership"],
        extracted_skills: [],
        match_summary: {
          strong: [],
          partial: [],
          gaps: ["Stakeholder management"],
        },
      },
      [
        {
          id: "card-1",
          title: "Shift handover",
          summary: "Led a shift handover improvement.",
          competencies: ["leadership"],
          confidence_status: "confirmed",
        },
      ],
    );

    expect(pack.gaps).toEqual([
      expect.objectContaining({
        label: "Stakeholder management",
        coverage: "gap",
        prompt:
          "Add a confirmed example that proves Stakeholder management for this role.",
      }),
    ]);
    expect(pack.likelyQuestions).toContain(
      "What real example could show Stakeholder management for Operations Lead?",
    );
  });
});
