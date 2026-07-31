"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RETENTION_POLICY } from "@/lib/retention";

type Attempt = {
  id: string;
  answer_text: string;
  scores: Record<string, number>;
  feedback: {
    strengths: string[];
    improvements: string[];
    tryAgain: string[];
    evidenceComparison: { used: string[]; missed: string[] };
    summary: string;
  };
  structure_breakdown?: {
    contextPercentage: number;
    actionPercentage: number;
    outcomePercentage: number;
  } | null;
  attempt_number: number;
  audio_path?: string | null;
};

function FeedbackInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/practice/sessions/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load");
        return;
      }
      const found =
        (data.session.practice_attempts as Attempt[]).find((a) => a.id === attemptId) ??
        data.session.practice_attempts.at(-1);
      setAttempt(found ?? null);
    }
    load();
  }, [id, attemptId]);

  async function deleteAudio() {
    if (!attempt?.audio_path) return;
    if (
      !confirm(
        "Delete this stored audio recording? The transcript and feedback will remain.",
      )
    ) {
      return;
    }

    const res = await fetch(`/api/files/audio?attemptId=${attempt.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    setAttempt({ ...attempt, audio_path: null });
    toast.success("Audio deleted");
  }

  if (!attempt) return <p className="text-stone-600">Loading feedback…</p>;

  const scoreEntries = Object.entries(attempt.scores ?? {}).filter(
    ([, v]) => typeof v === "number",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-teal-950">Feedback</h1>
          <p className="text-stone-600">Attempt {attempt.attempt_number}</p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href={`/practice/${id}`} />}>
            Retry
          </Button>
          <Button variant="outline" render={<Link href={`/practice/${id}/compare`} />}>
            Compare
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-stone-700">{attempt.feedback.summary}</p>
          <p className="mt-3 text-xs text-stone-500">
            Scores are progress indicators, not a definitive measure of interview ability.
            Feedback does not assess personality, emotion, honesty, employability, or
            whether you would get the job.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {scoreEntries.map(([key, value]) => (
          <Badge key={key} variant="secondary">
            {key}: {value}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["Strengths", attempt.feedback.strengths],
            ["Improvements", attempt.feedback.improvements],
            ["Try again", attempt.feedback.tryAgain],
          ] as const
        ).map(([title, items]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-4 text-sm text-stone-700">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence comparison</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Used from your card</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {attempt.feedback.evidenceComparison.used.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Missed from your card</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {attempt.feedback.evidenceComparison.missed.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {attempt.structure_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Structure breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <span>Context {attempt.structure_breakdown.contextPercentage}%</span>
            <span>Action {attempt.structure_breakdown.actionPercentage}%</span>
            <span>Outcome {attempt.structure_breakdown.outcomePercentage}%</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your answer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-stone-700">{attempt.answer_text}</p>
          <p className="mt-3 text-xs text-stone-500">
            {RETENTION_POLICY.practiceAudio} {RETENTION_POLICY.practiceTranscripts}
          </p>
          {attempt.audio_path && (
            <Button className="mt-4" variant="destructive" size="sm" onClick={deleteAudio}>
              Delete audio recording
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackInner />
    </Suspense>
  );
}
