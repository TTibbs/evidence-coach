import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { NextResponse } from "next/server";

const createSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("job_targets")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ jobTargets: data });
}

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  try {
    await assertWithinLimit(user!.id, "create_job_target");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const { data, error } = await supabase
    .from("job_targets")
    .insert({
      user_id: user!.id,
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ jobTarget: data }, { status: 201 });
}
