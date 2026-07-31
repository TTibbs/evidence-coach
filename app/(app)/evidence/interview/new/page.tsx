"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceDictationControl } from "@/components/voice-dictation-control";
import { mergeTranscript } from "@/lib/transcript-text";

function InterviewInner() {
  const searchParams = useSearchParams();
  const experienceId = searchParams.get("experienceId");
  const focus = searchParams.get("focus");
  const router = useRouter();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function start() {
      if (!experienceId) {
        toast.error("Missing experience");
        router.push("/experiences");
        return;
      }
      const res = await fetch("/api/evidence/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", experienceId, focus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not start interview");
        setLoading(false);
        return;
      }
      setInterviewId(data.interview.id);
      setTopic(data.interview.topic);
      setQuestions(data.interview.questions);
      setIndex(data.interview.current_index);
      setLoading(false);
    }
    start();
  }, [experienceId, focus, router]);

  async function submitAnswer() {
    if (!interviewId || !answer.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/evidence/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "answer",
        interviewId,
        answer: answer.trim(),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to submit");
      return;
    }
    if (data.done) {
      toast.success("Draft evidence card created");
      router.push(`/evidence/${data.card.id}`);
      return;
    }
    setQuestions(data.interview.questions);
    setIndex(data.interview.current_index);
    setAnswer("");
  }

  if (loading) {
    return <p className="text-stone-600">Preparing guided questions…</p>;
  }

  const total = Math.max(questions.length, 1);
  const progress = Math.min(100, Math.round((index / total) * 100));

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Evidence interview</CardTitle>
        <CardDescription>
          Topic: {topic}. One question at a time — answer from real experience only.
          {focus ? ` Focus: ${focus}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm text-stone-500">
            <span>
              Question {index + 1} of ~{questions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <p className="text-lg font-medium text-stone-900">{questions[index]}</p>
        <Textarea
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Describe what you personally did…"
          aria-label="Your answer"
        />
        <VoiceDictationControl
          onTranscript={(transcript) =>
            setAnswer((current) => mergeTranscript(current, transcript))
          }
        />
        <div className="flex gap-2">
          <Button onClick={submitAnswer} disabled={submitting || !answer.trim()}>
            {submitting ? "Saving…" : "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/experiences/${experienceId}`)}
          >
            Save and exit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewEvidenceInterviewPage() {
  return (
    <Suspense>
      <InterviewInner />
    </Suspense>
  );
}
