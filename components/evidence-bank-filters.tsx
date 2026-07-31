"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function FiltersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.push(`/evidence?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        placeholder="Search cards"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
        aria-label="Search evidence cards"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => apply({ q: q || null })}
      >
        Search
      </Button>
      <Button
        type="button"
        variant={searchParams.get("status") === "confirmed" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          apply({
            status:
              searchParams.get("status") === "confirmed" ? null : "confirmed",
          })
        }
      >
        Confirmed
      </Button>
      <Button
        type="button"
        variant={searchParams.get("status") === "draft" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          apply({
            status: searchParams.get("status") === "draft" ? null : "draft",
          })
        }
      >
        Drafts
      </Button>
      <Button
        type="button"
        variant={searchParams.get("favourites") === "1" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          apply({
            favourites: searchParams.get("favourites") === "1" ? null : "1",
          })
        }
      >
        Favourites
      </Button>
    </div>
  );
}

export function EvidenceBankFilters() {
  return (
    <Suspense>
      <FiltersInner />
    </Suspense>
  );
}
