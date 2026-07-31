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
};

type JobTarget = {
  id: string;
  title: string;
  company?: string | null;
};

const OUTPUT_TYPES: { value: GeneratedContentType; label: string }[] = [
  { value: "cv-bullet", label: "CV bullet" },
  { value: "role-summary", label: "Role summary" },
  { value: "profile", label: "Profile" },
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
  } | null>(null);
  const [edited, setEdited] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [cardsRes, targetsRes] = await Promise.all([
        fetch("/api/evidence?status=confirmed"),
        fetch("/api/job-targets"),
      ]);
      const cardsData = await cardsRes.json();
      const targetsData = await targetsRes.json();
      setCards(cardsData.cards ?? []);
      setTargets(targetsData.jobTargets ?? []);
    }
    load();
  }, []);

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
    toast.success("Edits saved");
  }

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
              {cards.length === 0 && (
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
                <div className="space-y-2">
                  <Label htmlFor="edited">Your version</Label>
                  <Textarea
                    id="edited"
                    rows={12}
                    value={edited}
                    onChange={(e) => setEdited(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={saveEdits}>
                  Save edits
                </Button>
              </>
            ) : (
              <p className="text-stone-500">Generated content will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
