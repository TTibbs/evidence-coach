"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeneratedContentType } from "@/types/domain";
import { AiDisclosure } from "@/components/ai-disclosure";

type CardOption = {
  id: string;
  title: string;
  summary: string;
  source_facts?: string[] | null;
};

type JobTarget = {
  id: string;
  title: string;
  company?: string | null;
};

type GeneratedItem = {
  id: string;
  type: GeneratedContentType;
  content: string;
  user_edited_content?: string | null;
  evidence_card_ids?: string[] | null;
  created_at: string;
};

const OUTPUT_TYPES: { value: GeneratedContentType; label: string }[] = [
  { value: "cv-bullet", label: "CV bullet" },
  { value: "role-summary", label: "Role summary" },
  { value: "profile", label: "Profile" },
  { value: "cover-letter-paragraph", label: "Cover-letter paragraph" },
  { value: "star-answer", label: "STAR answer" },
  { value: "twenty-sixty-twenty", label: "20/60/20 answer" },
  { value: "application-answer", label: "Application answer" },
  { value: "tell-me-about-yourself", label: "Tell me about yourself" },
];

export default function BuilderPage() {
  const [cards, setCards] = useState<CardOption[]>([]);
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<GeneratedContentType>("cv-bullet");
  const [jobTargetId, setJobTargetId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{
    id: string;
    content: string;
    user_edited_content?: string | null;
    evidence_card_ids?: string[] | null;
  } | null>(null);
  const [history, setHistory] = useState<GeneratedItem[]>([]);
  const [edited, setEdited] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cardsRes, targetsRes, generatedRes] = await Promise.all([
          fetch("/api/evidence?status=confirmed"),
          fetch("/api/job-targets"),
          fetch("/api/generate"),
        ]);
        const cardsData = await cardsRes.json();
        const targetsData = await targetsRes.json();
        const generatedData = await generatedRes.json();
        if (!cardsRes.ok || !targetsRes.ok || !generatedRes.ok) {
          throw new Error(
            cardsData.error ||
              targetsData.error ||
              generatedData.error ||
              "Could not load builder data",
          );
        }
        setCards(cardsData.cards ?? []);
        setTargets(targetsData.jobTargets ?? []);
        setHistory(generatedData.items ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load builder data";
        setLoadError(message);
        toast.error(message);
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, []);

  async function refreshHistory() {
    const res = await fetch("/api/generate");
    if (!res.ok) return;
    const data = await res.json();
    setHistory(data.items ?? []);
  }

  function toggleCard(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function generate() {
    if (selected.length === 0) {
      toast.error("Select at least one confirmed evidence card");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        evidenceCardIds: selected,
        jobTargetId: jobTargetId || null,
        question: question || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Generation failed");
      return;
    }
    setResult(data.content);
    setEdited(data.content.content);
    await refreshHistory();
    toast.success("Content generated");
  }

  async function saveEdits() {
    if (!result) return;
    const res = await fetch("/api/generate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.id, userEditedContent: edited }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Save failed");
      return;
    }
    setResult(data.content);
    await refreshHistory();
    toast.success("Edits saved");
  }

  async function copyOutput() {
    if (!result) return;
    const text = edited.trim() || result.user_edited_content || result.content;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy content");
    }
  }

  function loadHistoryItem(item: GeneratedItem) {
    setResult(item);
    setEdited(item.user_edited_content || item.content);
  }

  const factsUsed = result
    ? cards
        .filter((card) => (result.evidence_card_ids ?? []).includes(card.id))
        .flatMap((card) =>
          (card.source_facts ?? []).map((fact) => ({
            cardTitle: card.title,
            fact,
          })),
        )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Builder</h1>
        <p className="mt-1 text-stone-600">
          Generate CV and interview content from confirmed evidence only.
        </p>
        <div className="mt-3">
          <AiDisclosure compact />
        </div>
      </div>
      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Choose output type and evidence cards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Output type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  if (value != null) setType(value as GeneratedContentType);
                }}
                items={OUTPUT_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTarget">Job target (optional)</Label>
              <Select
                value={jobTargetId || null}
                onValueChange={(value) => setJobTargetId(value ?? "")}
                items={targets.map((t) => ({
                  value: t.id,
                  label: t.company ? `${t.title} — ${t.company}` : t.title,
                }))}
              >
                <SelectTrigger id="jobTarget">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                      {t.company ? ` — ${t.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question (for answers)</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Optional interview question"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmed evidence cards</Label>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {cards.map((card) => (
                  <li key={card.id}>
                    <label className="flex cursor-pointer gap-3 rounded-md border border-stone-200 p-3 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={selected.includes(card.id)}
                        onChange={() => toggleCard(card.id)}
                      />
                      <span>
                        <span className="block font-medium">{card.title}</span>
                        <span className="text-sm text-stone-500 line-clamp-2">
                          {card.summary}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
                {pageLoading && (
                  <p className="text-sm text-stone-500">Loading confirmed cards…</p>
                )}
                {!pageLoading && cards.length === 0 && (
                  <p className="text-sm text-stone-500">
                    Confirm at least one evidence card first.
                  </p>
                )}
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Generate"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              Edit and save your preferred version. Original is preserved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
                  <Badge variant="secondary" className="mb-2">
                    Original
                  </Badge>
                  <p className="whitespace-pre-wrap">{result.content}</p>
                </div>
                <div className="rounded-md border border-teal-100 bg-teal-50 p-3">
                  <p className="mb-2 text-sm font-medium text-teal-950">
                    Facts used
                  </p>
                  {factsUsed.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-teal-950">
                      {factsUsed.map(({ cardTitle, fact }) => (
                        <li key={`${cardTitle}-${fact}`}>
                          <span className="font-medium">{cardTitle}:</span> {fact}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-teal-900">
                      No source facts were stored for the selected evidence cards.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edited">Your version</Label>
                  <Textarea
                    id="edited"
                    rows={12}
                    value={edited}
                    onChange={(e) => setEdited(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={saveEdits}>
                    Save edits
                  </Button>
                  <Button variant="outline" onClick={copyOutput}>
                    Copy
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-stone-500">Generated content will appear here.</p>
            )}
            <div className="border-t border-stone-200 pt-4">
              <p className="mb-2 text-sm font-medium text-stone-700">Recent outputs</p>
              {history.length > 0 ? (
                <ul className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{item.type}</span>
                        <span className="ml-2 text-stone-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </span>
                      <Button size="sm" variant="outline" onClick={() => loadHistoryItem(item)}>
                        Open
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">No generated outputs yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
