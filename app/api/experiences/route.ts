import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import { experienceTypeSchema } from "@/lib/ai/schemas";
import { NextResponse } from "next/server";

const createSchema = z.object({
  type: experienceTypeSchema.default("employment"),
  organisation: z.string().optional().nullable(),
  title: z.string().min(1),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional().nullable(),
  responsibilities: z.array(z.string()).default([]),
});

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("experiences")
    .select("*, evidence_cards(count)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ experiences: data });
}

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  try {
    await assertWithinLimit(user!.id, "create_experience");
  } catch (e) {
    if (e instanceof EntitlementError) return jsonError(e.message, 403);
    throw e;
  }

  const { data, error } = await supabase
    .from("experiences")
    .insert({
      user_id: user!.id,
      type: parsed.data.type,
      organisation: parsed.data.organisation,
      title: parsed.data.title,
      location: parsed.data.location,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      is_current: parsed.data.isCurrent,
      description: parsed.data.description,
      responsibilities: parsed.data.responsibilities,
      source: "manual",
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ experience: data }, { status: 201 });
}
