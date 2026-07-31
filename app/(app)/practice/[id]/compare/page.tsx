"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Attempt = {
  id: string;
  answer_text: string;
  scores: Record<string, number>;
  attempt_number: number;
};

export default function CompareAttemptsPage() {
  const { id } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/practice/sessions/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load");
        setLoading(false);
        return;
      }
      const loaded = (data.session.practice_attempts ?? []) as Attempt[];
      setAttempts(loaded);
      setLeftId(loaded.at(0)?.id ?? "");
      setRightId(loaded.at(-1)?.id ?? "");
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <p className="text-stone-600">Loading attempts…</p>;
  }

  if (attempts.length < 2) {
    return (
      <div className="space-y-4">
        <p className="text-stone-600">
          Complete at least two attempts to compare them side by side.
        </p>
        <Button render={<Link href={`/practice/${id}`} />}>Try another answer</Button>
      </div>
    );
  }

  const a = attempts.find((attempt) => attempt.id === leftId) ?? attempts[0]!;
  const b = attempts.find((attempt) => attempt.id === rightId) ?? attempts.at(-1)!;
  const keys = Array.from(
    new Set([...Object.keys(a.scores ?? {}), ...Object.keys(b.scores ?? {})]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Compare attempts</h1>
        <p className="text-stone-600">
          Attempt {a.attempt_number} vs attempt {b.attempt_number}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose attempts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Select
            value={a.id}
            onValueChange={(value) => setLeftId(value ?? "")}
            items={attempts.map((attempt) => ({
              value: attempt.id,
              label: `Attempt ${attempt.attempt_number}`,
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attempts.map((attempt) => (
                <SelectItem key={attempt.id} value={attempt.id}>
                  Attempt {attempt.attempt_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={b.id}
            onValueChange={(value) => setRightId(value ?? "")}
            items={attempts.map((attempt) => ({
              value: attempt.id,
              label: `Attempt ${attempt.attempt_number}`,
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attempts.map((attempt) => (
                <SelectItem key={attempt.id} value={attempt.id}>
                  Attempt {attempt.attempt_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {[a, b].map((attempt) => (
          <Card key={attempt.id}>
            <CardHeader>
              <CardTitle>Attempt {attempt.attempt_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {keys.map((key) => (
                  <Badge key={key} variant="secondary">
                    {key}: {attempt.scores?.[key] ?? "—"}
                  </Badge>
                ))}
              </div>
              <p className="whitespace-pre-wrap text-sm text-stone-700">
                {attempt.answer_text}
              </p>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/practice/${id}/feedback?attempt=${attempt.id}`} />}
              >
                View feedback
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {keys.map((key) => {
            const delta = (b.scores?.[key] ?? 0) - (a.scores?.[key] ?? 0);
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key}</span>
                <span className={delta >= 0 ? "text-emerald-700" : "text-red-700"}>
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
