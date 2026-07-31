"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ExperienceRowProps = {
  id: string;
  title: string;
  organisation: string | null;
  evidenceCount: number;
};

export function ExperienceRow({
  id,
  title,
  organisation,
  evidenceCount,
}: ExperienceRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      const res = await fetch(`/api/experiences/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(data?.error ?? "Could not remove experience.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const description =
    evidenceCount > 0
      ? `This also deletes ${evidenceCount} linked evidence card${evidenceCount === 1 ? "" : "s"}. This cannot be undone.`
      : "This cannot be undone.";

  return (
    <li className="flex items-stretch gap-1 rounded-lg border border-stone-200 bg-white hover:border-teal-300">
      <Link
        href={`/experiences/${id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">{title}</p>
          <p className="truncate text-sm text-stone-500">
            {organisation || "No organisation"}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {evidenceCount} evidence
        </Badge>
      </Link>
      <div className="flex items-center border-l border-stone-100 pr-2 pl-1">
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (pending) return;
            setOpen(next);
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${title}`}
                title="Remove"
                className="text-destructive hover:text-destructive"
              />
            }
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove “{title}”?</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  void remove();
                }}
              >
                {pending ? "Removing…" : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
