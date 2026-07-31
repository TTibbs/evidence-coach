"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RESPONSIBILITY_IMPROVE_STYLES,
  RESPONSIBILITY_STYLE_LABELS,
} from "@/lib/ai/schemas";

type ImproveStyle = (typeof RESPONSIBILITY_IMPROVE_STYLES)[number];

const STYLE_ITEMS = RESPONSIBILITY_IMPROVE_STYLES.map((value) => ({
  value,
  label: RESPONSIBILITY_STYLE_LABELS[value],
}));

export function ImproveResponsibilitiesControl({
  title,
  organisation,
  type,
  responsibilities,
  onImproved,
}: {
  title: string;
  organisation?: string | null;
  type?: string;
  responsibilities: string[];
  onImproved: (next: string[]) => void;
}) {
  const [style, setStyle] = useState<ImproveStyle>("polish");
  const [loading, setLoading] = useState(false);

  const hasContent = responsibilities.some((line) => line.trim());

  async function improve() {
    if (!hasContent) {
      toast.error("Add at least one responsibility first");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a title before improving responsibilities");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/cv/improve-responsibilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        organisation: organisation || null,
        type,
        style,
        responsibilities,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Could not improve responsibilities");
      return;
    }

    const next = (data.responsibilities as string[]) ?? [];
    if (next.length === 0) {
      toast.error("AI returned no responsibilities");
      return;
    }
    onImproved(next);
    toast.success("Responsibilities improved — review before confirming");
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1 space-y-1">
        <Label htmlFor="improve-style" className="text-xs text-stone-500">
          AI improvement style
        </Label>
        <Select
          value={style}
          onValueChange={(value) => {
            if (value != null) setStyle(value as ImproveStyle);
          }}
          items={STYLE_ITEMS}
        >
          <SelectTrigger id="improve-style" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STYLE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={improve}
        disabled={loading || !hasContent}
        aria-label="Improve responsibilities with AI"
        title="Improve with AI"
      >
        <Sparkles className="size-3.5" />
        {loading ? "Improving…" : "Improve"}
      </Button>
    </div>
  );
}
