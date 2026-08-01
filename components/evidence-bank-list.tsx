"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type EvidenceBankCard = {
  id: string;
  experience_id?: string | null;
  title: string;
  summary?: string | null;
  confidence_status: "draft" | "confirmed";
  is_favourite?: boolean | null;
  archived_at?: string | null;
  experiences?: { title?: string | null } | null;
};

type Props = {
  cards: EvidenceBankCard[];
};

export function EvidenceBankList({ cards }: Props) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveOriginals, setArchiveOriginals] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedCards = useMemo(
    () => cards.filter((card) => selectedIds.includes(card.id)),
    [cards, selectedIds],
  );
  const selectedExperienceIds = new Set(
    selectedCards.map((card) => card.experience_id).filter(Boolean),
  );
  const canMerge = selectedCards.length >= 2 && selectedExperienceIds.size === 1;

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds([]);
    setArchiveOriginals(false);
  }

  async function mergeSelected() {
    if (!canMerge) return;
    setPending(true);
    const res = await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "merge",
        cardIds: selectedIds,
        archiveOriginals,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      toast.error(data.error || "Could not merge cards");
      return;
    }

    toast.success(
      archiveOriginals
        ? "Merged draft created and originals archived"
        : "Merged draft created",
    );
    setConfirmOpen(false);
    exitSelection();
    router.push(`/evidence/${data.card.id}`);
    router.refresh();
  }

  if (cards.length === 0) {
    return <p className="text-stone-600">No evidence cards match these filters.</p>;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {selectionMode
            ? `${selectedCards.length} selected`
            : `${cards.length} ${cards.length === 1 ? "card" : "cards"}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {selectionMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === cards.length
                      ? []
                      : cards.map((card) => card.id),
                  )
                }
              >
                {selectedIds.length === cards.length ? "Clear all" : "Select all"}
              </Button>
              <AlertDialog
                open={confirmOpen}
                onOpenChange={(next) => {
                  if (pending) return;
                  setConfirmOpen(next);
                }}
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      disabled={!canMerge}
                    />
                  }
                >
                  Merge selected
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Create a merged draft from {selectedCards.length} cards?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The new card will be a draft. Originals stay in your evidence
                      bank unless you choose to archive them below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-stone-700">Selected cards</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-stone-600">
                        {selectedCards.map((card) => (
                          <li key={card.id}>{card.title}</li>
                        ))}
                      </ul>
                    </div>
                    <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                      <input
                        type="checkbox"
                        checked={archiveOriginals}
                        onChange={(event) =>
                          setArchiveOriginals(event.target.checked)
                        }
                      />
                      <span>
                        Archive the selected originals after creating the merged
                        draft. This removes them from the active evidence bank:
                        {" "}
                        {selectedCards.map((card) => card.title).join(", ")}.
                      </span>
                    </label>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        void mergeSelected();
                      }}
                    >
                      {pending ? "Merging..." : "Create merged draft"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={exitSelection}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectionMode(true)}
            >
              Select multiple
            </Button>
          )}
        </div>
      </div>

      {selectionMode && selectedCards.length >= 2 && selectedExperienceIds.size > 1 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Merge currently requires cards from the same source experience so the
          new draft keeps accurate provenance.
        </div>
      )}

      <ul className="space-y-2">
        {cards.map((card) => {
          const selected = selectedIds.includes(card.id);
          const content = (
            <>
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
                {card.experiences?.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                {card.summary}
              </p>
            </>
          );

          return (
            <li key={card.id}>
              {selectionMode ? (
                <label className="flex cursor-pointer gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected}
                    onChange={() => toggleSelected(card.id)}
                  />
                  <span className="min-w-0 flex-1">{content}</span>
                </label>
              ) : (
                <Link
                  href={`/evidence/${card.id}`}
                  className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
