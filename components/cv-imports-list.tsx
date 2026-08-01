"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type CvImportListItem = {
  id: string;
  original_filename?: string | null;
  status: string;
  created_at: string;
  confirmed_at?: string | null;
};

type CvImportsListProps = {
  imports: CvImportListItem[];
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CvImportsList({ imports }: CvImportsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function download(id: string) {
    const res = await fetch(`/api/files/cv?id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Download failed");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function deleteCv(id: string) {
    if (!confirm("Delete this stored CV file? Your saved experiences will remain.")) {
      return;
    }

    setDeletingId(id);
    const res = await fetch(`/api/files/cv?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    toast.success("CV file deleted");
    router.refresh();
  }

  if (imports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 px-4 py-8">
        <p className="text-sm text-stone-500">No uploaded CVs yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {imports.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">
              {item.original_filename ?? "Uploaded CV"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {item.status}
              {formatDate(item.created_at)
                ? ` · uploaded ${formatDate(item.created_at)}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              render={<Link href={`/cv/${item.id}`} />}
            >
              View CV
            </Button>
            {item.status === "ready_for_review" && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/onboarding/review/${item.id}`} />}
              >
                Review import
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void download(item.id);
              }}
            >
              Download
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deletingId === item.id}
              onClick={() => {
                void deleteCv(item.id);
              }}
            >
              {deletingId === item.id ? "Deleting..." : "Delete file"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
