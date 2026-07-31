import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { improveResponsibilities } from "@/lib/ai/improve-responsibilities";
import { AiProviderError } from "@/lib/ai/errors";
import { responsibilityImproveStyleSchema } from "@/lib/ai/schemas";
import { NextResponse } from "next/server";

const schema = z.object({
  title: z.string().min(1),
  organisation: z.string().optional().nullable(),
  type: z.string().optional(),
  style: responsibilityImproveStyleSchema.default("polish"),
  responsibilities: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  void supabase;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const cleaned = parsed.data.responsibilities
    .map((line) => line.trim())
    .filter(Boolean);
  if (cleaned.length === 0) {
    return jsonError("Add at least one responsibility before improving");
  }

  try {
    await assertWithinLimit(user!.id, "content_generation");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  try {
    const result = await improveResponsibilities(
      {
        title: parsed.data.title,
        organisation: parsed.data.organisation,
        type: parsed.data.type,
        style: parsed.data.style,
        responsibilities: cleaned,
      },
      user!.id,
    );

    await recordUsage(user!.id, "content_generation", 1, {
      type: "responsibility_improve",
      style: parsed.data.style,
    });

    return NextResponse.json({
      responsibilities: result.responsibilities
        .map((line) => line.trim())
        .filter(Boolean),
    });
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }
}
