import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STARTER_COMPETENCIES } from "@/types/domain";
import { EvidenceBankFilters } from "@/components/evidence-bank-filters";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EvidenceBankPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("evidence_cards")
    .select("*, experiences(title, organisation)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (params.archived !== "1") query = query.is("archived_at", null);
  if (params.status) query = query.eq("confidence_status", params.status);
  if (params.favourites === "1") query = query.eq("is_favourite", true);
  if (params.competency) {
    query = query.contains("competencies", [params.competency]);
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,summary.ilike.%${params.q}%`);
  }

  const { data: cards } = await query;

  const covered = new Set<string>();
  for (const card of cards ?? []) {
    if (card.confidence_status !== "confirmed") continue;
    for (const c of card.competencies ?? []) covered.add(c.toLowerCase());
  }
  const gaps = STARTER_COMPETENCIES.filter((c) => !covered.has(c));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-teal-950">Evidence Bank</h1>
          <p className="mt-1 text-stone-600">
            Confirmed examples you can reuse across CV content and practice.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/experiences" />}>
          Create from experience
        </Button>
      </div>

      <EvidenceBankFilters />

      {gaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-950">Evidence gaps</p>
          <p className="mt-1 text-sm text-amber-900">
            Consider adding examples covering: {gaps.slice(0, 5).join(", ")}
            {gaps.length > 5 ? "…" : ""}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {(cards ?? []).map((card) => (
          <li key={card.id}>
            <Link
              href={`/evidence/${card.id}`}
              className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{card.title}</p>
                <div className="flex gap-2">
                  {card.is_favourite && <Badge>Favourite</Badge>}
                  <Badge
                    variant={
                      card.confidence_status === "confirmed" ? "success" : "warning"
                    }
                  >
                    {card.confidence_status}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {(card.experiences as { title?: string } | null)?.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600">{card.summary}</p>
            </Link>
          </li>
        ))}
      </ul>

      {(cards ?? []).length === 0 && (
        <p className="text-stone-600">No evidence cards match these filters.</p>
      )}
    </div>
  );
}
