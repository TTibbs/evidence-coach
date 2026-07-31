"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
type Session = {
  id: string;
  question: string;
  mode: string;
  created_at: string;
  evidence_cards?: { title?: string } | null;
};

export default function PracticePage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [question, setQuestion] = useState("");
  const [evidenceCardId, setEvidenceCardId] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const [cardsRes, sessionsRes] = await Promise.all([
        fetch("/api/evidence?status=confirmed"),
        fetch("/api/practice/sessions"),
      ]);
      const cardsData = await cardsRes.json();
      const sessionsData = await sessionsRes.json();
      setCards(cardsData.cards ?? []);
      setSessions(sessionsData.sessions ?? []);
    }
    load();
  }, []);

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
