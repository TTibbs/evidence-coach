import { z } from "zod";
import { requireUser, jsonError } from "@/lib/api/auth";
import {
  buildDuplicatedEvidenceDraft,
  buildMergedEvidenceDraft,
  type EvidenceCardForCompose,
} from "@/lib/evidence-card-compose";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const competency = searchParams.get("competency");
  const favourites = searchParams.get("favourites") === "1";
  const includeArchived = searchParams.get("archived") === "1";

  let query = supabase
    .from("evidence_cards")
    .select("*, experiences(title, organisation)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }
  if (status) query = query.eq("confidence_status", status);
  if (favourites) query = query.eq("is_favourite", true);
  if (competency) query = query.contains("competencies", [competency]);
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ cards: data });
}

const patchSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  situation: z.string().optional(),
  task: z.string().optional().nullable(),
  actions: z.array(z.string()).optional(),
  outcome: z.string().optional(),
  reflection: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  competencies: z.array(z.string()).optional(),
  metrics: z.array(z.any()).optional(),
  sourceFacts: z.array(z.string()).optional(),
  isFavourite: z.boolean().optional(),
  archived: z.boolean().optional(),
});

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("duplicate"),
    cardId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("merge"),
    cardIds: z.array(z.string().uuid()).min(2),
    archiveOriginals: z.boolean().default(false),
  }),
]);

const cardSelect =
  "id, experience_id, title, summary, situation, task, actions, outcome, reflection, skills, competencies, metrics, source_facts";

function orderCardsBySelection(
  cards: EvidenceCardForCompose[],
  selectedIds: string[],
) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return selectedIds.flatMap((id) => {
    const card = byId.get(id);
    return card ? [card] : [];
  });
}

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.message);

  if (parsed.data.action === "duplicate") {
    const { data: card, error } = await supabase
      .from("evidence_cards")
      .select(cardSelect)
      .eq("id", parsed.data.cardId)
      .eq("user_id", user!.id)
      .single();

    if (error || !card) return jsonError("Evidence card not found", 404);

    const { data: duplicated, error: insertError } = await supabase
      .from("evidence_cards")
      .insert({
        user_id: user!.id,
        ...buildDuplicatedEvidenceDraft(card as EvidenceCardForCompose),
      })
      .select()
      .single();

    if (insertError) return jsonError(insertError.message, 500);
    return NextResponse.json({ card: duplicated }, { status: 201 });
  }

  const selectedIds = [...new Set(parsed.data.cardIds)];
  if (selectedIds.length < 2) {
    return jsonError("Select at least two evidence cards to merge");
  }

  const { data: cards, error } = await supabase
    .from("evidence_cards")
    .select(cardSelect)
    .eq("user_id", user!.id)
    .is("archived_at", null)
    .in("id", selectedIds);

  if (error) return jsonError(error.message, 500);
  if ((cards ?? []).length !== selectedIds.length) {
    return jsonError("One or more selected evidence cards could not be found", 404);
  }

  let draft;
  try {
    draft = buildMergedEvidenceDraft(
      orderCardsBySelection(cards as EvidenceCardForCompose[], selectedIds),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not merge cards";
    return jsonError(message);
  }

  const { data: merged, error: insertError } = await supabase
    .from("evidence_cards")
    .insert({
      user_id: user!.id,
      ...draft,
    })
    .select()
    .single();

  if (insertError) return jsonError(insertError.message, 500);

  if (parsed.data.archiveOriginals) {
    const { error: archiveError } = await supabase
      .from("evidence_cards")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", user!.id)
      .in("id", selectedIds);

    if (archiveError) return jsonError(archiveError.message, 500);
  }

  return NextResponse.json(
    {
      card: merged,
      archivedIds: parsed.data.archiveOriginals ? selectedIds : [],
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const id = body.id as string | undefined;
  if (!id) return jsonError("Missing id");

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.title !== undefined) updates.title = d.title;
  if (d.summary !== undefined) updates.summary = d.summary;
  if (d.situation !== undefined) updates.situation = d.situation;
  if (d.task !== undefined) updates.task = d.task;
  if (d.actions !== undefined) updates.actions = d.actions;
  if (d.outcome !== undefined) updates.outcome = d.outcome;
  if (d.reflection !== undefined) updates.reflection = d.reflection;
  if (d.skills !== undefined) updates.skills = d.skills;
  if (d.competencies !== undefined) updates.competencies = d.competencies;
  if (d.metrics !== undefined) updates.metrics = d.metrics;
  if (d.sourceFacts !== undefined) updates.source_facts = d.sourceFacts;
  if (d.isFavourite !== undefined) updates.is_favourite = d.isFavourite;
  if (d.archived !== undefined) {
    updates.archived_at = d.archived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("evidence_cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ card: data });
}
