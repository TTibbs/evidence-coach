import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrichEvidenceCard } from "@/lib/ai/evidence";

const enrichEvidenceCardMock = vi.fn();

vi.mock("@/lib/ai/run", () => ({
  withCareerAi: vi.fn(
    async (
      _context: unknown,
      run: (provider: { enrichEvidenceCard: typeof enrichEvidenceCardMock }) => unknown,
    ) => run({ enrichEvidenceCard: enrichEvidenceCardMock }),
  ),
}));

describe("enrichEvidenceCard", () => {
  beforeEach(() => {
    enrichEvidenceCardMock.mockReset();
    enrichEvidenceCardMock.mockResolvedValue({
      title: "Updated card",
      summary: "Updated summary",
      situation: "Existing situation",
      task: null,
      actions: ["Existing action", "Added rota responsibility"],
      outcome: "Updated outcome",
      reflection: null,
      skills: ["planning"],
      competencies: ["ownership"],
      metrics: [{ label: "Coverage", value: "2 roles", confirmed: true }],
      sourceFacts: ["Existing fact"],
    });
  });

  it("passes existing card fields and additional details to the provider", async () => {
    const existingCard = {
      title: "Original card",
      summary: "Original summary",
      actions: ["Existing action"],
    };

    await enrichEvidenceCard(
      {
        experience: {
          title: "Supervisor",
          organisation: "Example Co",
          responsibilities: ["Managed rotas"],
        },
        existingCard,
        additionalDetails: "I also covered supervisor duties.",
      },
      "user-1",
    );

    expect(enrichEvidenceCardMock).toHaveBeenCalledWith({
      experience: {
        title: "Supervisor",
        organisation: "Example Co",
        responsibilities: ["Managed rotas"],
      },
      existingCard,
      additionalDetails: "I also covered supervisor duties.",
    });
  });

  it("keeps enriched metrics unconfirmed and includes additional details in source facts", async () => {
    const draft = await enrichEvidenceCard(
      {
        experience: {
          title: "Supervisor",
          responsibilities: ["Managed rotas"],
        },
        existingCard: { title: "Original card" },
        additionalDetails: "I also covered supervisor duties.",
      },
      "user-1",
    );

    expect(draft.metrics).toEqual([
      { label: "Coverage", value: "2 roles", confirmed: false },
    ]);
    expect(draft.sourceFacts).toContain("I also covered supervisor duties.");
  });
});
