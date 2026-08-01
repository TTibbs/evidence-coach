import { describe, expect, it } from "vitest";
import {
  buildDuplicatedEvidenceDraft,
  buildMergedEvidenceDraft,
} from "@/lib/evidence-card-compose";

describe("evidence card compose helpers", () => {
  it("duplicates a card as a reviewable draft", () => {
    expect(
      buildDuplicatedEvidenceDraft({
        id: "card-1",
        experience_id: "exp-1",
        title: "Customer escalation",
        summary: "Resolved a complaint",
        metrics: [{ label: "Time saved", value: "2 hours", confirmed: true }],
      }),
    ).toMatchObject({
      title: "Customer escalation (copy)",
      experience_id: "exp-1",
      confidence_status: "draft",
      is_favourite: false,
      metrics: [{ label: "Time saved", value: "2 hours", confirmed: false }],
    });
  });

  it("merges cards from the same source into a new draft", () => {
    const merged = buildMergedEvidenceDraft([
      {
        id: "card-1",
        experience_id: "exp-1",
        title: "Training rollout",
        summary: "Trained new starters.",
        situation: "The team had several new starters.",
        actions: ["Built a checklist", "Coached new starters"],
        skills: ["Coaching"],
        competencies: ["Leadership"],
        source_facts: ["Built a checklist"],
      },
      {
        id: "card-2",
        experience_id: "exp-1",
        title: "Training support",
        summary: "Supported onboarding.",
        situation: "New starters needed support.",
        actions: ["Coached new starters", "Answered questions"],
        skills: ["coaching", "Communication"],
        competencies: ["Teamwork"],
        source_facts: ["Answered questions"],
      },
    ]);

    expect(merged).toMatchObject({
      title: "Merged draft: Training rollout + Training support",
      confidence_status: "draft",
      experience_id: "exp-1",
      actions: ["Built a checklist", "Coached new starters", "Answered questions"],
      skills: ["Coaching", "Communication"],
      competencies: ["Leadership", "Teamwork"],
      source_facts: ["Built a checklist", "Answered questions"],
    });
  });

  it("rejects merges across source experiences", () => {
    expect(() =>
      buildMergedEvidenceDraft([
        { id: "card-1", experience_id: "exp-1", title: "One" },
        { id: "card-2", experience_id: "exp-2", title: "Two" },
      ]),
    ).toThrow(/same source experience/i);
  });
});
