import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { recordUsage } from "@/lib/entitlements/record";
import { analyseJobDescription } from "@/lib/ai/jd";
import { AiProviderError } from "@/lib/ai/errors";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data, error } = await supabase
    .from("job_targets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ jobTarget: data });
}

const updateSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const { data, error } = await supabase
    .from("job_targets")
    .update({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.company !== undefined
        ? { company: parsed.data.company }
        : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
    })
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ jobTarget: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { error } = await supabase
    .from("job_targets")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.action !== "analyse") return jsonError("Unknown action");

  try {
    await assertWithinLimit(user!.id, "job_analysis");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const { data: jobTarget, error } = await supabase
    .from("job_targets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !jobTarget) return jsonError("Job target not found", 404);
  if (!jobTarget.description) return jsonError("Add a job description first");

  const { data: cards } = await supabase
    .from("evidence_cards")
    .select("*")
    .eq("user_id", user!.id)
    .eq("confidence_status", "confirmed");

  let analysis;
  try {
    analysis = await analyseJobDescription(
      {
        title: jobTarget.title,
        description: jobTarget.description,
        confirmedCards: cards ?? [],
      },
      user!.id,
    );
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }

  const { data: updated, error: updateError } = await supabase
    .from("job_targets")
    .update({
      extracted_skills: analysis.extractedSkills,
      extracted_competencies: analysis.extractedCompetencies,
      match_summary: analysis.matchSummary,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return jsonError(updateError.message, 500);
  await recordUsage(user!.id, "job_analysis", 1, { jobTargetId: id });
  return NextResponse.json({ jobTarget: updated });
}
