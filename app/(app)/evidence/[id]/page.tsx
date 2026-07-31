"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  title: string;
  summary: string;
  situation: string;
  task?: string | null;
  actions: string[];
  outcome: string;
  reflection?: string | null;
  skills: string[];
  competencies: string[];
  metrics: { label: string; value: string; confirmed: boolean }[];
  source_facts: string[];
  confidence_status: "draft" | "confirmed";
  is_favourite: boolean;
  experiences?: { title?: string; organisation?: string } | null;
};

export default function EvidenceCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/evidence/detail?id=${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Card not found");
        setLoading(false);
        return;
      }
      setCard(data.card);
      setLoading(false);
    }
    load();
  }, [id]);

  async function saveEdits() {
    if (!card) return;
    setSaving(true);
    const res = await fetch("/api/evidence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: card.id,
        title: card.title,
        summary: card.summary,
        situation: card.situation,
        task: card.task,
        actions: card.actions.map((line) => line.trim()).filter(Boolean),
        outcome: card.outcome,
        reflection: card.reflection,
        skills: card.skills,
        competencies: card.competencies,
        metrics: card.metrics,
        sourceFacts: card.source_facts,
        isFavourite: card.is_favourite,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Save failed");
      return;
    }
    setCard(data.card);
    toast.success("Saved");
  }

  async function toggleFavourite() {
    if (!card) return;
    const next = !card.is_favourite;
    setCard({ ...card, is_favourite: next });
    const res = await fetch("/api/evidence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, isFavourite: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      setCard({ ...card, is_favourite: !next });
      return;
    }
    setCard(data.card);
  }

  async function confirmCard() {
    if (!card) return;
    setSaving(true);
    const res = await fetch("/api/evidence/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirm",
        cardId: card.id,
        updates: {
          title: card.title,
          summary: card.summary,
          situation: card.situation,
          task: card.task,
          actions: card.actions.map((line) => line.trim()).filter(Boolean),
          outcome: card.outcome,
          reflection: card.reflection,
          skills: card.skills,
          competencies: card.competencies,
          metrics: card.metrics,
          sourceFacts: card.source_facts,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Confirm failed");
      return;
    }
    setCard(data.card);
    toast.success("Evidence card confirmed");
    router.refresh();
  }

  if (loading || !card) {
    return <p className="text-stone-600">Loading card…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex gap-2">
            <Badge
              variant={card.confidence_status === "confirmed" ? "success" : "warning"}
            >
              {card.confidence_status}
            </Badge>
            {card.is_favourite && <Badge>Favourite</Badge>}
          </div>
          <h1 className="font-display text-3xl text-teal-950">Evidence card</h1>
          <p className="text-stone-600">
            From {card.experiences?.title ?? "experience"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={toggleFavourite}>
            {card.is_favourite ? "Unfavourite" : "Favourite"}
          </Button>
          {card.confidence_status === "draft" && (
            <Button onClick={confirmCard} disabled={saving}>
              Confirm card
            </Button>
          )}
          <Button variant="secondary" onClick={saveEdits} disabled={saving}>
            Save edits
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Structured fields</CardTitle>
          <CardDescription>
            Edit freely. Suggested metrics stay unconfirmed until you confirm the
            card — edit or remove them if they do not feel roughly right.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={card.title}
              onChange={(e) => setCard({ ...card, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              value={card.summary}
              onChange={(e) => setCard({ ...card, summary: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Situation</Label>
            <Textarea
              value={card.situation}
              onChange={(e) => setCard({ ...card, situation: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Actions (one per line)</Label>
            <Textarea
              value={card.actions.join("\n")}
              onChange={(e) =>
                setCard({
                  ...card,
                  actions: e.target.value.split("\n"),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Textarea
              value={card.outcome}
              onChange={(e) => setCard({ ...card, outcome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Competencies (comma separated)</Label>
            <Input
              value={card.competencies.join(", ")}
              onChange={(e) =>
                setCard({
                  ...card,
                  competencies: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <Label>Source facts</Label>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-600">
              {(card.source_facts ?? []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <Label>Metrics</Label>
            <p className="text-sm text-stone-500">
              The AI may have estimated figures from impact wording (e.g. “save
              time”). Edit until they feel roughly right, or remove them before
              confirming.
            </p>
            {(card.metrics ?? []).length === 0 ? (
              <p className="text-sm text-stone-500">No metrics on this card.</p>
            ) : (
              <ul className="space-y-3">
                {card.metrics.map((m, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-2 rounded-md border border-stone-200 p-3 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.confirmed ? "success" : "warning"}>
                          {m.confirmed ? "Confirmed" : "Suggested"}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`metric-label-${i}`}>Label</Label>
                          <Input
                            id={`metric-label-${i}`}
                            value={m.label}
                            onChange={(e) => {
                              const metrics = [...card.metrics];
                              metrics[i] = { ...m, label: e.target.value };
                              setCard({ ...card, metrics });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`metric-value-${i}`}>Value</Label>
                          <Input
                            id={`metric-value-${i}`}
                            value={m.value}
                            onChange={(e) => {
                              const metrics = [...card.metrics];
                              metrics[i] = { ...m, value: e.target.value };
                              setCard({ ...card, metrics });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setCard({
                          ...card,
                          metrics: card.metrics.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
