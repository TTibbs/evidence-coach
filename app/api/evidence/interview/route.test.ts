import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiProviderError } from "@/lib/ai/errors";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  enrichEvidenceCard: vi.fn(),
  cardLookup: vi.fn(),
  cardUpdate: vi.fn(),
}));

vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth")>(
    "@/lib/api/auth",
  );

  return {
    ...actual,
    requireUser: mocks.requireUser,
  };
});

vi.mock("@/lib/ai/evidence", () => ({
  decideNextQuestion: vi.fn(),
  draftEvidenceCard: vi.fn(),
  enrichEvidenceCard: mocks.enrichEvidenceCard,
  suggestEvidenceQuestions: vi.fn(),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/evidence/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock() {
  return {
    from(table: string) {
      expect(table).toBe("evidence_cards");
      let updatePayload: Record<string, unknown> | null = null;

      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        update: vi.fn((payload: Record<string, unknown>) => {
          updatePayload = payload;
          return chain;
        }),
        single: vi.fn(async () => {
          if (updatePayload) return mocks.cardUpdate(updatePayload);
          return mocks.cardLookup();
        }),
      };

      return chain;
    },
  };
}

const existingDraftCard = {
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "user-1",
  experience_id: "00000000-0000-4000-8000-000000000002",
  title: "Original card",
  summary: "Original summary",
  situation: "Original situation",
  task: null,
  actions: ["Original action"],
  outcome: "Original outcome",
  reflection: null,
  skills: [],
  competencies: [],
  metrics: [],
  source_facts: ["Original fact"],
  confidence_status: "draft",
  experiences: {
    title: "Team Leader",
    organisation: "Example Co",
    description: "Two roles at the same company",
    responsibilities: ["Managed rotas"],
  },
};

const enrichedDraft = {
  title: "Updated card",
  summary: "Updated summary",
  situation: "Original situation",
  task: null,
  actions: ["Original action", "Covered supervisor responsibilities"],
  outcome: "Updated outcome",
  reflection: null,
  skills: ["planning"],
  competencies: ["ownership"],
  metrics: [{ label: "Role coverage", value: "2 roles", confirmed: false }],
  sourceFacts: ["Original fact", "Covered supervisor responsibilities"],
};

describe("evidence interview enrich action", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.enrichEvidenceCard.mockReset();
    mocks.cardLookup.mockReset();
    mocks.cardUpdate.mockReset();

    mocks.requireUser.mockResolvedValue({
      user: { id: "user-1" },
      supabase: createSupabaseMock(),
      response: null,
    });
    mocks.cardLookup.mockResolvedValue({ data: existingDraftCard, error: null });
    mocks.enrichEvidenceCard.mockResolvedValue(enrichedDraft);
    mocks.cardUpdate.mockImplementation((payload: Record<string, unknown>) => ({
      data: {
        ...existingDraftCard,
        ...payload,
        experiences: { title: "Team Leader", organisation: "Example Co" },
      },
      error: null,
    }));
  });

  it("rejects missing card ids or blank additional details", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        action: "enrich",
        cardId: "00000000-0000-4000-8000-000000000001",
        additionalDetails: "   ",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.enrichEvidenceCard).not.toHaveBeenCalled();
  });

  it("rejects cards not owned by the user", async () => {
    mocks.cardLookup.mockResolvedValue({ data: null, error: new Error("No row") });
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        action: "enrich",
        cardId: "00000000-0000-4000-8000-000000000001",
        additionalDetails: "I also handled supervisor duties.",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Evidence card not found",
    });
    expect(response.status).toBe(404);
  });

  it("returns updated draft fields without confirming the card", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        action: "enrich",
        cardId: "00000000-0000-4000-8000-000000000001",
        additionalDetails: "I also handled supervisor duties.",
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.card).toMatchObject({
      title: "Updated card",
      confidence_status: "draft",
      actions: ["Original action", "Covered supervisor responsibilities"],
      source_facts: ["Original fact", "Covered supervisor responsibilities"],
    });
    expect(mocks.enrichEvidenceCard).toHaveBeenCalledWith(
      expect.objectContaining({
        existingCard: existingDraftCard,
        additionalDetails: "I also handled supervisor duties.",
      }),
      "user-1",
    );
  });

  it("converts AI failures to existing AI error JSON", async () => {
    mocks.enrichEvidenceCard.mockRejectedValue(
      new AiProviderError({
        category: "invalid_output",
        userMessage: "We could not validate the generated result. Please try again.",
      }),
    );
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        action: "enrich",
        cardId: "00000000-0000-4000-8000-000000000001",
        additionalDetails: "I also handled supervisor duties.",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "We could not validate the generated result. Please try again.",
      category: "invalid_output",
    });
    expect(response.status).toBe(503);
  });
});
