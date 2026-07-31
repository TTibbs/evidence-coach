import { describe, expect, it } from "vitest";
import { mergeTranscript } from "@/lib/transcript-text";

describe("mergeTranscript", () => {
  it("uses transcript as the answer when the field is empty", () => {
    expect(mergeTranscript("", " I led the rollout. ")).toBe(
      "I led the rollout.",
    );
  });

  it("appends transcript after existing typed text", () => {
    expect(mergeTranscript("I handled planning.", "I also trained the team.")).toBe(
      "I handled planning.\n\nI also trained the team.",
    );
  });

  it("ignores blank transcripts", () => {
    expect(mergeTranscript("Keep this", "   ")).toBe("Keep this");
  });
});
