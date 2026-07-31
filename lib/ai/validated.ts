import type { z } from "zod";
import { AiProviderError } from "@/lib/ai/errors";

export function validateAiPayload<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;

  throw new AiProviderError({
    category: "invalid_output",
    userMessage: "We could not validate the generated result. Please try again.",
    message: `${label} failed schema validation: ${parsed.error.message}`,
    cause: parsed.error,
  });
}
