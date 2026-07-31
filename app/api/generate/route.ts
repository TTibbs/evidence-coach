import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { generateFromEvidence } from "@/lib/ai/generate";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

const schema = z.object({
  type: z.enum([
    "cv-bullet",
    "role-summary",
    "profile",
    "cover-letter-paragraph",
    "star-answer",
    "twenty-sixty-twenty",
    "application-answer",
    "tell-me-about-yourself",
  ]),
  evidenceCardIds: z.array(z.string().uuid()).min(1),
  jobTargetId: z.string().uuid().optional().nullable(),
  question: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  try {
    await assertWithinLimit(user!.id, "content_generation");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const { data: cards, error: cardsError } = await supabase
    .from("evidence_cards")
    .select("*")
    .eq("user_id", user!.id)
    .eq("confidence_status", "confirmed")
    .in("id", parsed.data.evidenceCardIds);

  if (cardsError) return jsonError(cardsError.message, 500);
  if (!cards?.length) {
    return jsonError("Select at least one confirmed evidence card");
  }

  let jobTarget = null;
  if (parsed.data.jobTargetId) {
    const { data } = await supabase
      .from("job_targets")
      .select("*")
      .eq("id", parsed.data.jobTargetId)
      .eq("user_id", user!.id)
      .single();
    jobTarget = data;
  }

  let generated;
  try {
    generated = await generateFromEvidence(
      {
        type: parsed.data.type,
        cards,
        jobTarget,
        question: parsed.data.question,
      },
      user!.id,
    );
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }

  const { data: saved, error } = await supabase
    .from("generated_content")
    .insert({
      user_id: user!.id,
      evidence_card_ids: cards.map((c) => c.id),
      job_target_id: parsed.data.jobTargetId || null,
      type: parsed.data.type,
      content: generated.content,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  await recordUsage(user!.id, "content_generation", 1, {
    type: parsed.data.type,
  });

  return NextResponse.json({ content: saved, notes: generated.notes }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const id = body.id as string;
  const userEditedContent = body.userEditedContent as string;
  if (!id || userEditedContent === undefined) return jsonError("Missing fields");

  const { data, error } = await supabase
    .from("generated_content")
    .update({ user_edited_content: userEditedContent })
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ content: data });
}

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("generated_content")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ items: data });
}
