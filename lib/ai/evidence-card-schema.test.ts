import { describe, expect, it } from "vitest";
import {
  coerceEvidenceCardDraft,
  coerceStringArray,
  evidenceCardDraftSchema,
} from "@/lib/ai/schemas";

describe("coerceStringArray", () => {
  it("accepts arrays and prose strings", () => {
    expect(coerceStringArray(["a", "b"])).toEqual(["a", "b"]);
    expect(coerceStringArray("Showed them the headset")).toEqual([
      "Showed them the headset",
    ]);
    expect(coerceStringArray("- First\n- Second")).toEqual(["First", "Second"]);
  });

  it("reads text from object items", () => {
    expect(coerceStringArray([{ action: "Trained starters" }])).toEqual([
      "Trained starters",
    ]);
  });
});

describe("evidenceCardDraftSchema", () => {
  it("accepts a well-formed draft", () => {
    const result = evidenceCardDraftSchema.safeParse({
      title: "Helping a new starter",
      summary: "Supported onboarding",
      situation: "New starter was behind",
      task: "Get them productive",
      actions: ["Walked them through picking"],
      outcome: "They finished the shift",
      skills: ["coaching"],
      competencies: ["teamwork"],
      metrics: [],
      sourceFacts: ["I showed them the system"],
    });
    expect(result.success).toBe(true);
  });

  it("coerces common Gemini shape quirks", () => {
    const result = evidenceCardDraftSchema.safeParse({
      title: "Warehouse coaching",
      summary: "Helped a starter",
      situation: "They were struggling with headset picking",
      actions: "I demonstrated the route and checked their first picks",
      outcome: "They completed picks with fewer errors",
      skills: "coaching, communication",
      competencies: null,
      metrics: [{ label: "errors", value: 3, confirmed: false }],
      source_facts: ["I demonstrated the route"],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.actions.length).toBeGreaterThan(0);
    expect(result.data.sourceFacts).toEqual(["I demonstrated the route"]);
    expect(result.data.metrics[0]?.value).toBe("3");
    expect(result.data.competencies).toEqual([]);
  });

  it("fills actions from sourceFacts when actions missing", () => {
    const coerced = coerceEvidenceCardDraft({
      title: "Example",
      summary: "s",
      situation: "sit",
      outcome: "out",
      sourceFacts: ["Did the thing"],
    }) as { actions: string[] };

    expect(coerced.actions).toEqual(["Did the thing"]);
  });
});
