"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiDisclosure } from "@/components/ai-disclosure";

type CardOption = { id: string; title: string };
type JobTarget = {
  id: string;
  title: string;
  company?: string | null;
};
type Session = {
  id: string;
  question: string;
  mode: string;
  created_at: string;
  evidence_cards?: { title?: string } | null;
};

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<CardOption[]>([]);
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [question, setQuestion] = useState("");
  const [evidenceCardId, setEvidenceCardId] = useState("");
  const [jobTargetId, setJobTargetId] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [creating, setCreating] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const requestedJobTargetId = searchParams.get("jobTargetId") ?? "";
  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === jobTargetId),
    [jobTargetId, targets],
  );

  useEffect(() => {
    async function load() {
      const [cardsRes, sessionsRes, targetsRes] = await Promise.all([
        fetch("/api/evidence?status=confirmed"),
        fetch("/api/practice/sessions"),
        fetch("/api/job-targets"),
      ]);
      const cardsData = await cardsRes.json();
      const sessionsData = await sessionsRes.json();
      const targetsData = await targetsRes.json();
      setCards(cardsData.cards ?? []);
      setSessions(sessionsData.sessions ?? []);
      const loadedTargets = (targetsData.jobTargets ?? []) as JobTarget[];
      setTargets(loadedTargets);
      if (
        requestedJobTargetId &&
        loadedTargets.some((target) => target.id === requestedJobTargetId)
      ) {
        setJobTargetId(requestedJobTargetId);
      }
    }
    load();
  }, [requestedJobTargetId]);

  async function generateQuestion() {
    if (!evidenceCardId) {
      toast.error("Select a confirmed evidence card first");
      return;
    }
    setGeneratingQuestion(true);
    const res = await fetch("/api/practice/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidenceCardId,
        jobTargetId: jobTargetId || null,
      }),
    });
    const data = await res.json();
    setGeneratingQuestion(false);
    if (!res.ok) {
      toast.error(data.error || "Could not generate question");
      return;
    }
    setQuestion(data.question);
    toast.success("Question generated");
  }

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/practice/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        mode,
        evidenceCardId: evidenceCardId || null,
        jobTargetId: jobTargetId || null,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Could not start session");
      return;
    }
    router.push(`/practice/${data.session.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Practice</h1>
        <p className="mt-1 text-stone-600">
          Practise answering with your evidence, then get actionable feedback.
        </p>
        <div className="mt-3">
          <AiDisclosure compact />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start a session</CardTitle>
          <CardDescription>
            Text or voice. Voice answers are transcribed for your review before analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={startSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Interview question</Label>
              <Input
                id="question"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Tell me about a time you helped a new starter…"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateQuestion}
                disabled={generatingQuestion || !evidenceCardId}
              >
                {generatingQuestion ? "Generating…" : "Generate from evidence"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card">Evidence card</Label>
              <Select
                value={evidenceCardId || null}
                onValueChange={(value) => setEvidenceCardId(value ?? "")}
                items={cards.map((c) => ({ value: c.id, label: c.title }))}
              >
                <SelectTrigger id="card">
                  <SelectValue placeholder="Select confirmed card" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTarget">Job target</Label>
              <Select
                value={jobTargetId || null}
                onValueChange={(value) => setJobTargetId(value ?? "")}
                items={targets.map((t) => ({
                  value: t.id,
                  label: t.company ? `${t.title} — ${t.company}` : t.title,
                }))}
              >
                <SelectTrigger id="jobTarget">
                  <SelectValue placeholder="Optional role context" />
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
              {selectedTarget && (
                <p className="rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-950">
                  Practising for {selectedTarget.title}
                  {selectedTarget.company ? ` at ${selectedTarget.company}` : ""}.
                  Generate a question from a confirmed evidence card to keep the answer grounded.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "text"}
                    onChange={() => setMode("text")}
                  />
                  Text
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "voice"}
                    onChange={() => setMode("voice")}
                  />
                  Voice
                </label>
              </div>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Starting…" : "Start practice"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="font-display text-xl">Recent sessions</h2>
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/practice/${s.id}`}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300"
              >
                <p className="font-medium">{s.question}</p>
                <p className="text-sm text-stone-500">
                  {s.mode} · {s.evidence_cards?.title ?? "No card"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PracticePageFallback() {
  return <p className="text-stone-600">Loading practice setup…</p>;
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticePageFallback />}>
      <PracticePageContent />
    </Suspense>
  );
}
