"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { ExperienceRow } from "@/components/experience-row";
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
import { Button } from "@/components/ui/button";
import {
  removeSelectedIds,
  selectMissingIds,
  toggleSelectedId,
} from "@/lib/experience-selection";

export type ExperienceListItem = {
  id: string;
  type: string;
  title: string;
  organisation: string | null;
  evidenceCount: number;
};

type ExperiencesListProps = {
  experiences: ExperienceListItem[];
  focus?: string;
};

export function ExperiencesList({ experiences, focus }: ExperiencesListProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const grouped = useMemo(
    () =>
      experiences.reduce<Record<string, ExperienceListItem[]>>((acc, exp) => {
        acc[exp.type] = acc[exp.type] ?? [];
        acc[exp.type]!.push(exp);
        return acc;
      }, {}),
    [experiences],
  );

  const selectedItems = experiences.filter((exp) => selectedIds.includes(exp.id));
  const selectedEvidenceCount = selectedItems.reduce(
    (sum, exp) => sum + exp.evidenceCount,
    0,
  );

  function exitSelection() {
    setSelecting(false);
    setSelectedIds([]);
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;

    setPending(true);
    const deletedIds: string[] = [];
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/experiences/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast.error(data?.error ?? "Could not delete every selected experience.");
          break;
        }
        deletedIds.push(id);
      }

      if (deletedIds.length > 0) {
        toast.success(
          `Deleted ${deletedIds.length} experience${deletedIds.length === 1 ? "" : "s"}`,
        );
        setSelectedIds((current) => removeSelectedIds(current, deletedIds));
        router.refresh();
      }

      if (deletedIds.length === selectedIds.length) {
        setConfirmOpen(false);
        exitSelection();
      }
    } finally {
      setPending(false);
    }
  }

  if (experiences.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2">
        <p className="text-sm text-stone-600">
          {selecting
            ? `${selectedIds.length} selected`
            : `${experiences.length} saved experience${experiences.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {selecting ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === experiences.length
                      ? []
                      : selectMissingIds(
                          selectedIds,
                          experiences.map((exp) => exp.id),
                        ),
                  )
                }
              >
                {selectedIds.length === experiences.length
                  ? "Clear all"
                  : "Select all"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={exitSelection}
              >
                Cancel
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
                      variant="destructive"
                      size="sm"
                      disabled={selectedIds.length === 0}
                    />
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  Delete selected
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedIds.length} selected experience
                      {selectedIds.length === 1 ? "" : "s"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedEvidenceCount > 0
                        ? `This also deletes ${selectedEvidenceCount} linked evidence card${selectedEvidenceCount === 1 ? "" : "s"}. This cannot be undone.`
                        : "This cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => {
                        void deleteSelected();
                      }}
                    >
                      {pending ? "Deleting..." : "Delete selected"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelecting(true)}
            >
              Select multiple
            </Button>
          )}
        </div>
      </div>

      {Object.entries(grouped).map(([type, items]) => {
        const sectionIds = items.map((item) => item.id);
        const allInSectionSelected = sectionIds.every((id) =>
          selectedIds.includes(id),
        );

        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                {type}
              </h2>
              {selecting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    setSelectedIds(
                      allInSectionSelected
                        ? selectedIds.filter((id) => !sectionIds.includes(id))
                        : selectMissingIds(selectedIds, sectionIds),
                    )
                  }
                >
                  {allInSectionSelected ? "Clear section" : "Select section"}
                </Button>
              )}
            </div>
            <ul className="space-y-2">
              {items.map((exp) => (
                <ExperienceRow
                  key={exp.id}
                  id={exp.id}
                  title={exp.title}
                  organisation={exp.organisation}
                  evidenceCount={exp.evidenceCount}
                  focus={focus}
                  selectionMode={selecting}
                  selected={selectedIds.includes(exp.id)}
                  onSelectedChange={() =>
                    setSelectedIds((current) => toggleSelectedId(current, exp.id))
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
