import { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import { getOpenAiModel } from "@/lib/ai/config";

export async function openaiStructuredCompletion<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
): Promise<{ data: T; inputTokens?: number; outputTokens?: number }> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: getOpenAiModel(),
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${system}

Respond with valid JSON only matching the required schema.
Do not present invented figures as confirmed facts. Follow the system prompt for whether suggested estimates are allowed.
Prefer modest credible wording over exaggeration.`,
      },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty AI response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response failed schema validation: ${result.error.message}`,
    );
  }

  return {
    data: result.data,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}

/**
 * @deprecated Use getCareerAiProvider() instead.
 */
export async function structuredCompletion(
  ..._args: [unknown, string, string]
): Promise<never> {
  void _args;
  throw new Error(
    "structuredCompletion is deprecated. Use getCareerAiProvider() instead.",
  );
}
