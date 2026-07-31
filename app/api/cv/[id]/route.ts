import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { extractedExperienceSchema } from "@/lib/ai/schemas";
import { normalizeCvDate } from "@/lib/cv/dates";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { NextResponse } from "next/server";

const confirmSchema = z.object({
  experiences: z.array(extractedExperienceSchema),
  name: z.string().optional().nullable(),
});

const patchSchema = z.object({
  extractedText: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> };

function experienceMatchKey(input: {
  title?: string | null;
  organisation?: string | null;
}) {
  return `${(input.title ?? "").trim().toLowerCase()}|${(input.organisation ?? "").trim().toLowerCase()}`;
}

export async function GET(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data, error } = await supabase
    .from("cv_imports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ cvImport: data });
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const { data, error } = await supabase
    .from("cv_imports")
    .update({ extracted_text: parsed.data.extractedText })
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ cvImport: data });
}

export async function POST(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data: cvImport, error: fetchError } = await supabase
    .from("cv_imports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (fetchError || !cvImport) return jsonError("CV import not found", 404);

  const parsed = confirmSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const isResync = cvImport.status === "confirmed";

  // Match against all of the user's experiences so a re-upload updates and
  // re-links existing roles instead of leaving orphans without cv_import_id.
  const { data: existingRows } = await supabase
    .from("experiences")
    .select("id, title, organisation, cv_import_id")
    .eq("user_id", user!.id);

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [experienceMatchKey(row), row.id]),
  );

  let created = 0;
  let updated = 0;

  for (let i = 0; i < parsed.data.experiences.length; i++) {
    const exp = parsed.data.experiences[i];
    const key = experienceMatchKey(exp);
    const existingId = existingByKey.get(key);

    const fields = {
      type: exp.type,
      organisation: exp.organisation,
      title: exp.title,
      location: exp.location,
      start_date: normalizeCvDate(exp.startDate),
      end_date: exp.isCurrent ? null : normalizeCvDate(exp.endDate),
      is_current: exp.isCurrent,
      description: exp.description,
      responsibilities: exp.responsibilities,
      source: "cv-import" as const,
      cv_import_id: id,
    };

    if (existingId) {
      const { error } = await supabase
        .from("experiences")
        .update(fields)
        .eq("id", existingId)
        .eq("user_id", user!.id);
      if (error) return jsonError(error.message, 500);
      existingByKey.delete(key);
      updated += 1;
      continue;
    }

    try {
      await assertWithinLimit(user!.id, "create_experience");
    } catch (e) {
      if (e instanceof EntitlementError) {
        return jsonError(
          `${e.message} Saved ${updated} updates and ${created} new experiences.`,
          403,
        );
      }
      throw e;
    }

    const { error } = await supabase.from("experiences").insert({
      user_id: user!.id,
      ...fields,
    });
    if (error) return jsonError(error.message, 500);
    created += 1;
  }

  if (parsed.data.name) {
    await supabase
      .from("profiles")
      .update({ name: parsed.data.name })
      .eq("id", user!.id);
  }

  const { data: updatedImport, error: updateError } = await supabase
    .from("cv_imports")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      extracted_draft: parsed.data,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return jsonError(updateError.message, 500);
  return NextResponse.json({
    cvImport: updatedImport,
    created,
    updated,
    resync: isResync,
  });
}
