import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockEntitlementError extends Error {}

  return {
    requireUser: vi.fn(),
    assertWithinLimit: vi.fn(),
    recordUsage: vi.fn(),
    withCareerAi: vi.fn(),
    storageFrom: vi.fn(),
    mockEntitlementError: MockEntitlementError,
  };
});

vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth")>(
    "@/lib/api/auth",
  );

  return {
    ...actual,
    requireUser: mocks.requireUser,
  };
});

vi.mock("@/lib/entitlements/check", async () => {
  const actual = await vi.importActual<typeof import("@/lib/entitlements/check")>(
    "@/lib/entitlements/check",
  );

  return {
    ...actual,
    EntitlementError: mocks.mockEntitlementError,
    assertWithinLimit: mocks.assertWithinLimit,
  };
});

vi.mock("@/lib/ai/run", () => ({
  withCareerAi: mocks.withCareerAi,
}));

vi.mock("@/lib/entitlements/record", () => ({
  recordUsage: mocks.recordUsage,
}));

function createTranscribeRequest(options?: {
  type?: string;
  durationSeconds?: string;
}) {
  const form = new FormData();
  form.append(
    "audio",
    new File([new Uint8Array([1, 2, 3])], "dictation.webm", {
      type: options?.type ?? "audio/webm",
    }),
  );
  if (options?.durationSeconds) {
    form.append("durationSeconds", options.durationSeconds);
  }

  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.assertWithinLimit.mockReset();
    mocks.recordUsage.mockReset();
    mocks.withCareerAi.mockReset();
    mocks.storageFrom.mockReset();

    mocks.requireUser.mockResolvedValue({
      user: { id: "user-1" },
      supabase: { storage: { from: mocks.storageFrom } },
      response: null,
    });
    mocks.assertWithinLimit.mockResolvedValue({
      maxVoiceRecordingSeconds: 120,
    });
    mocks.withCareerAi.mockResolvedValue({
      transcript: "I dealt with a difficult customer.",
    });
    mocks.recordUsage.mockResolvedValue(undefined);
  });

  it("returns a transcript for valid audio", async () => {
    const { POST } = await import("./route");
    const response = await POST(createTranscribeRequest({ durationSeconds: "4" }));

    await expect(response.json()).resolves.toEqual({
      transcript: "I dealt with a difficult customer.",
      durationSeconds: 4,
    });
    expect(response.status).toBe(200);
  });

  it("checks the voice transcription entitlement", async () => {
    const { POST } = await import("./route");
    await POST(createTranscribeRequest());

    expect(mocks.assertWithinLimit).toHaveBeenCalledWith(
      "user-1",
      "voice_transcription",
    );
  });

  it("records successful dictation usage in the voice transcription bucket", async () => {
    const { POST } = await import("./route");
    await POST(createTranscribeRequest());

    expect(mocks.recordUsage).toHaveBeenCalledWith(
      "user-1",
      "voice_transcription",
      1,
      { source: "dictation" },
    );
  });

  it("does not upload dictated audio to storage", async () => {
    const { POST } = await import("./route");
    await POST(createTranscribeRequest());

    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("converts entitlement failures to 403", async () => {
    mocks.assertWithinLimit.mockRejectedValue(
      new mocks.mockEntitlementError("Voice practice is not available on your plan."),
    );
    const { POST } = await import("./route");
    const response = await POST(createTranscribeRequest());

    await expect(response.json()).resolves.toEqual({
      error: "Voice practice is not available on your plan.",
    });
    expect(response.status).toBe(403);
  });

  it("converts AI failures to the existing AI error response", async () => {
    const { AiProviderError } = await import("@/lib/ai/errors");
    mocks.withCareerAi.mockRejectedValue(
      new AiProviderError({
        category: "invalid_output",
        userMessage: "We could not validate the generated result. Please try again.",
      }),
    );
    const { POST } = await import("./route");
    const response = await POST(createTranscribeRequest());

    await expect(response.json()).resolves.toEqual({
      error: "We could not validate the generated result. Please try again.",
      category: "invalid_output",
    });
    expect(response.status).toBe(503);
  });
});
