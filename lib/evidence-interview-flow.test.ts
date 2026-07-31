import { describe, expect, it } from "vitest";
import {
  ROLE_COVERAGE_CHECKPOINT,
  evidenceInterviewHref,
  shouldAskRoleCoverageCheckpoint,
} from "@/lib/evidence-interview-flow";

describe("shouldAskRoleCoverageCheckpoint", () => {
  it("asks once when a multi-responsibility experience reaches drafting", () => {
    expect(
      shouldAskRoleCoverageCheckpoint({
        questions: ["What happened?", "What did you do?"],
        currentIndex: 2,
        responsibilities: ["Ran shifts", "Covered supervisor duties"],
      }),
    ).toBe(true);
  });

  it("does not ask before planned questions are complete", () => {
    expect(
      shouldAskRoleCoverageCheckpoint({
        questions: ["What happened?", "What did you do?"],
        currentIndex: 1,
        responsibilities: ["Ran shifts", "Covered supervisor duties"],
      }),
    ).toBe(false);
  });

  it("does not ask for single-responsibility experiences", () => {
    expect(
      shouldAskRoleCoverageCheckpoint({
        questions: ["What happened?"],
        currentIndex: 1,
        responsibilities: ["Ran shifts"],
      }),
    ).toBe(false);
  });

  it("does not ask the checkpoint twice", () => {
    expect(
      shouldAskRoleCoverageCheckpoint({
        questions: ["What happened?", ROLE_COVERAGE_CHECKPOINT],
        currentIndex: 2,
        responsibilities: ["Ran shifts", "Covered supervisor duties"],
      }),
    ).toBe(false);
  });
});

describe("evidenceInterviewHref", () => {
  it("builds an interview URL with optional focus", () => {
    expect(evidenceInterviewHref("exp-1", "Covered supervisor duties")).toBe(
      "/evidence/interview/new?experienceId=exp-1&focus=Covered+supervisor+duties",
    );
  });

  it("omits empty focus values", () => {
    expect(evidenceInterviewHref("exp-1", "   ")).toBe(
      "/evidence/interview/new?experienceId=exp-1",
    );
  });
});
