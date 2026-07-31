import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AiProviderError } from "@/lib/ai/errors";
import { validateAiPayload } from "@/lib/ai/validated";

describe("validateAiPayload", () => {
  it("returns parsed data for schema-valid AI payloads", () => {
    const schema = z.object({ content: z.string() });

    expect(validateAiPayload(schema, { content: "Ready" }, "Generated content"))
      .toEqual({ content: "Ready" });
  });

  it("maps schema failures to invalid output errors before persistence", () => {
    const schema = z.object({ content: z.string() });

    expect(() =>
      validateAiPayload(schema, { content: 123 }, "Generated content"),
    ).toThrow(AiProviderError);

    try {
      validateAiPayload(schema, { content: 123 }, "Generated content");
    } catch (err) {
      expect(err).toBeInstanceOf(AiProviderError);
      expect((err as AiProviderError).category).toBe("invalid_output");
      expect((err as AiProviderError).userMessage).toContain("validate");
    }
  });
});
