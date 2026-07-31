import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { experienceTypeSchema } from "@/lib/ai/schemas";
import { NextResponse } from "next/server";

const updateSchema = z.object({
  type: experienceTypeSchema.optional(),
  organisation: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional().nullable(),
  responsibilities: z.array(z.string()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data, error } = await supabase
    .from("experiences")
    .select("*, evidence_cards(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ experience: data });
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.type !== undefined) updates.type = d.type;
  if (d.organisation !== undefined) updates.organisation = d.organisation;
  if (d.title !== undefined) updates.title = d.title;
  if (d.location !== undefined) updates.location = d.location;
  if (d.startDate !== undefined) updates.start_date = d.startDate || null;
  if (d.endDate !== undefined) updates.end_date = d.endDate || null;
  if (d.isCurrent !== undefined) updates.is_current = d.isCurrent;
  if (d.description !== undefined) updates.description = d.description;
  if (d.responsibilities !== undefined) updates.responsibilities = d.responsibilities;

  const { data, error } = await supabase
    .from("experiences")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ experience: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { error } = await supabase
    .from("experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
