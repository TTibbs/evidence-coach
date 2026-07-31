import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import { NextResponse } from "next/server";

const createSchema = z.object({
  question: z.string().min(1),
  mode: z.enum(["text", "voice"]).default("text"),
  evidenceCardId: z.string().uuid().optional().nullable(),
  jobTargetId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*, practice_attempts(count), evidence_cards(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ sessions: data });
}

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  if (parsed.data.evidenceCardId) {
    const { data: card } = await supabase
      .from("evidence_cards")
      .select("id, confidence_status")
      .eq("id", parsed.data.evidenceCardId)
      .eq("user_id", user!.id)
      .single();
    if (!card || card.confidence_status !== "confirmed") {
      return jsonError("Select a confirmed evidence card");
    }
  }

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user!.id,
      question: parsed.data.question,
      mode: parsed.data.mode,
      evidence_card_id: parsed.data.evidenceCardId || null,
      job_target_id: parsed.data.jobTargetId || null,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ session: data }, { status: 201 });
}
