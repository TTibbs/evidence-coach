import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("AI provider config and factory", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_GEMINI_ENABLED = "true";
    process.env.AI_OPENAI_ENABLED = "false";
    process.env.AI_OPENAI_USER_ACCESS = "false";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults to Gemini for MVP users", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const { getCareerAiProvider } = await import("@/lib/ai/get-provider");
    const provider = getCareerAiProvider({ id: "user-1" });
    expect(provider.name).toBe("gemini");
  });

  it("uses mock when AI_PROVIDER=mock", async () => {
    process.env.AI_PROVIDER = "mock";
    const { getCareerAiProvider } = await import("@/lib/ai/get-provider");
    const provider = getCareerAiProvider({ id: "user-1" });
    expect(provider.name).toBe("mock");
  });

  it("ignores client-requested openai and still returns gemini", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const { getCareerAiProvider } = await import("@/lib/ai/get-provider");
    const provider = getCareerAiProvider({ id: "user-1" }, "openai");
    expect(provider.name).toBe("gemini");
  });

  it("canUseProvider always returns false for openai in MVP", async () => {
    const { canUseProvider } = await import("@/lib/ai/config");
    expect(canUseProvider({ id: "user-1", plan: "intensive" }, "openai")).toBe(
      false,
    );
  });

  it("does not require OPENAI_API_KEY to import openai module when unused", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(import("@/lib/openai")).resolves.toBeTruthy();
  });

  it("throws a useful error when Gemini key is missing on invoke", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.AI_PROVIDER = "gemini";
    const { createProviderForTests } = await import("@/lib/ai/get-provider");
    const provider = createProviderForTests("gemini");
    await expect(
      provider.extractCv({ cvText: "Warehouse Operative at Example Co" }),
    ).rejects.toMatchObject({
      category: "missing_config",
    });
  });

  it("maps quota errors without suggesting openai fallback", async () => {
    const { mapProviderFailure } = await import("@/lib/ai/errors");
    const err = mapProviderFailure(
      new Error("RESOURCE_EXHAUSTED: quota exceeded"),
      "gemini",
    );
    expect(err.category).toBe("quota");
    expect(err.userMessage.toLowerCase()).toContain("free ai");
    expect(err.userMessage.toLowerCase()).not.toContain("openai");
  });
});

describe("Mock provider domain workflows", () => {
  it("runs extract → evidence → generate → feedback without network", async () => {
    process.env.AI_PROVIDER = "mock";
    const { createProviderForTests } = await import("@/lib/ai/get-provider");
    const provider = createProviderForTests("mock");

    const cv = await provider.extractCv({ cvText: "Helped new starters" });
    expect(cv.experiences.length).toBeGreaterThan(0);

    const questions = await provider.suggestEvidenceQuestions({
      experience: {
        title: "Warehouse Operative",
        responsibilities: ["Helped starters"],
      },
    });
    expect(questions.questions.length).toBeGreaterThan(0);

    const card = await provider.createEvidenceCard({
      experience: {
        title: "Warehouse Operative",
        responsibilities: ["Helped starters"],
      },
      topic: questions.topic,
      qa: [{ question: questions.questions[0], answer: "I showed them the system" }],
    });
    expect(card.title).toBeTruthy();
    expect(card.metrics).toEqual([]);

    const cardWithEstimate = await provider.createEvidenceCard({
      experience: {
        title: "Developer",
        responsibilities: ["Built tooling"],
      },
      topic: "Process improvement",
      qa: [
        {
          question: "What was the goal?",
          answer: "I automated checks to save time in the development process",
        },
      ],
    });
    expect(cardWithEstimate.metrics.length).toBeGreaterThan(0);
    expect(cardWithEstimate.metrics[0]?.confirmed).toBe(false);

    const improved = await provider.improveResponsibilities({
      title: "Developer",
      style: "polish",
      responsibilities: ["Helped automate checks"],
    });
    expect(improved.responsibilities.length).toBeGreaterThan(0);

    const content = await provider.generateCareerContent({
      type: "cv-bullet",
      cards: [card],
    });
    expect(content.content).toContain("cv-bullet");

    const feedback = await provider.analysePracticeAnswer({
      question: "Tell me about helping a starter",
      answerText: "I helped them learn picking",
      evidenceCard: card,
      mode: "text",
    });
    expect(feedback.scores.relevance).toBeGreaterThan(0);

    const transcript = await provider.transcribeAudio({
      audio: Buffer.from("fake"),
      mimeType: "audio/webm",
    });
    expect(transcript.transcript.length).toBeGreaterThan(0);
  });
});

describe("OpenAI provider remains compilable but blocked", () => {
  it("factory refuses openai when disabled even if AI_PROVIDER=openai", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_OPENAI_ENABLED = "false";
    process.env.AI_OPENAI_USER_ACCESS = "false";
    process.env.OPENAI_API_KEY = "sk-test";
    const { getCareerAiProvider } = await import("@/lib/ai/get-provider");
    expect(() => getCareerAiProvider({ id: "user-1" })).toThrow(/not available/i);
  });

  it("OpenAiCareerAiProvider class can be constructed", async () => {
    const { OpenAiCareerAiProvider } = await import(
      "@/lib/ai/providers/openai"
    );
    const provider = new OpenAiCareerAiProvider();
    expect(provider.name).toBe("openai");
  });
});

describe("schema validation", () => {
  it("rejects invalid CV extraction payloads", async () => {
    const { cvExtractionSchema } = await import("@/lib/ai/schemas");
    const result = cvExtractionSchema.safeParse({ experiences: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("AI usage memory store", () => {
  it("records provider and operation", async () => {
    const { createMemoryAiUsageStore } = await import("@/lib/ai/usage");
    const store = createMemoryAiUsageStore();
    await store.record({
      userId: "u1",
      provider: "gemini",
      model: "gemini-3.6-flash",
      operation: "cv_extraction",
      success: true,
      latencyMs: 12,
    });
    expect(store.events[0]?.provider).toBe("gemini");
    expect(store.events[0]?.operation).toBe("cv_extraction");
  });
});

describe("no OpenAI fallback on Gemini failure", () => {
  it("getCareerAiProvider does not swap to openai after gemini errors", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.OPENAI_API_KEY = "sk-should-not-be-used";
    const openaiSpy = vi.fn();
    vi.doMock("@/lib/ai/providers/openai", () => ({
      OpenAiCareerAiProvider: class {
        constructor() {
          openaiSpy();
        }
      },
    }));
    vi.resetModules();
    const { getCareerAiProvider } = await import("@/lib/ai/get-provider");
    const provider = getCareerAiProvider({ id: "user-1" });
    expect(provider.name).toBe("gemini");
    expect(openaiSpy).not.toHaveBeenCalled();
    vi.doUnmock("@/lib/ai/providers/openai");
  });
});
