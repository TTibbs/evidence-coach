import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateFromEvidence } from "@/lib/ai/generate";

const generateCareerContent = vi.fn();

vi.mock("@/lib/ai/run", () => ({
  withCareerAi: vi.fn(
    async (
      _context: unknown,
      run: (provider: { generateCareerContent: typeof generateCareerContent }) => unknown,
    ) => run({ generateCareerContent }),
  ),
}));

describe("generateFromEvidence", () => {
  beforeEach(() => {
    generateCareerContent.mockReset();
    generateCareerContent.mockResolvedValue({
      content: "Generated content",
      notes: "Test notes",
    });
  });

  it("passes only confirmed metrics to career content generation", async () => {
    await generateFromEvidence(
      {
        type: "cv-bullet",
        cards: [
          {
            id: "card-1",
            title: "Improved process",
            metrics: [
              { label: "Suggested time saved", value: "~15%", confirmed: false },
              { label: "Confirmed errors reduced", value: "3 fewer", confirmed: true },
            ],
          },
        ],
      },
      "user-1",
    );

    expect(generateCareerContent).toHaveBeenCalledWith(
      expect.objectContaining({
        cards: [
          expect.objectContaining({
            metrics: [
              {
                label: "Confirmed errors reduced",
                value: "3 fewer",
                confirmed: true,
              },
            ],
          }),
        ],
      }),
    );
  });
});
